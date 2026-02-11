import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartStore, clearCart, authStore } from '../../store';
import { createOrder, checkDelivery, addressAutocomplete } from '../../api';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Checkout.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

export default function Checkout() {
  const items = cartStore.useStore(s => s.items);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [comment, setComment] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Delivery check state
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  
  // Delivery type selection
  const [deliveryType, setDeliveryType] = useState('standard'); // 'standard', 'scheduled'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  // Address autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Check auth
  const token = authStore.useStore(s => s.token);
  const user = authStore.useStore(s => s.user);

  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (user) {
      if (user.name) setContactName(user.name);
      if (user.phone) setContactPhone(user.phone);
    }
  }, []);

  if (!token) return null;

  // Unique stores from cart
  const cartStores = [...new Set(items.map(i => i.store))];
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        addressInputRef.current && !addressInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Fetch address suggestions
  useEffect(() => {
    if (address.length < 3 || selectedPlaceId) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const city = localStorage.getItem('city') || 'almaty';
        console.log('[Checkout] Fetching suggestions for:', address);
        const result = await addressAutocomplete(address, city);
        console.log('[Checkout] Got suggestions:', result.predictions?.length);
        setSuggestions(result.predictions || []);
        if (result.predictions?.length > 0) {
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [address, selectedPlaceId]);
  
  // Handle address input change
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setSelectedPlaceId(null); // Reset place selection
    setDeliveryInfo(null);
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setAddress(suggestion.mainText);
    setSelectedPlaceId(suggestion.placeId);
    setShowSuggestions(false);
    setSuggestions([]);
  };
  
  // Check delivery when address is selected
  const doCheckDelivery = useCallback(async (addr, placeId) => {
    if (!addr || addr.length < 5) {
      setDeliveryInfo(null);
      setDeliveryError('');
      return;
    }
    
    setCheckingDelivery(true);
    setDeliveryError('');
    
    try {
      const city = localStorage.getItem('city') || 'almaty';
      // Check only stores that are in cart
      const storesToCheck = cartStores.filter(s => ['wolt', 'airba'].includes(s));
      
      if (storesToCheck.length === 0) {
        // No Wolt/Airba stores - just mark as available
        setDeliveryInfo({ stores: {} });
        return;
      }
      
      const result = await checkDelivery(addr, city, storesToCheck, placeId);
      setDeliveryInfo(result);
      
      // Check if any store is unavailable
      const unavailable = Object.entries(result.stores || {})
        .filter(([_, info]) => !info.available)
        .map(([store]) => store);
        
      if (unavailable.length > 0) {
        setDeliveryError(`Доставка недоступна: ${unavailable.join(', ')}`);
      }
      
    } catch (err) {
      console.error('Delivery check failed:', err);
      setDeliveryError('Не удалось проверить доступность доставки');
    } finally {
      setCheckingDelivery(false);
    }
  }, [cartStores.join(',')]);
  
  // Check delivery when place is selected
  useEffect(() => {
    if (selectedPlaceId && address.length >= 3) {
      doCheckDelivery(address, selectedPlaceId);
    }
  }, [selectedPlaceId, address, doCheckDelivery]);

  if (items.length === 0) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Оформление заказа</h1>
        <div className={s.empty}>
          <div className={s.emptyIcon}><Icon name="cart" size={56} /></div>
          <h2 className={s.emptyTitle}>Корзина пуста</h2>
          <p className={s.emptyText}>Добавьте товары, чтобы оформить заказ</p>
          <Link to="/" className={s.emptyBtn}>Перейти к покупкам</Link>
        </div>
      </div>
    );
  }

  // Group by store
  const byStore = {};
  for (const item of items) {
    if (!byStore[item.store]) {
      byStore[item.store] = { store: item.store, storeName: item.storeName, items: [], subtotal: 0 };
    }
    byStore[item.store].items.push(item);
    byStore[item.store].subtotal += item.cost * item.quantity;
  }
  const storeGroups = Object.values(byStore);
  const total = items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  
  // Calculate delivery fees
  const deliveryFees = Object.entries(deliveryInfo?.stores || {}).reduce((sum, [store, info]) => {
    if (info.available && info.deliveryFee && byStore[store]) {
      return sum + info.deliveryFee;
    }
    return sum;
  }, 0);
  const grandTotal = total + deliveryFees;

  const worstCaseTotal = items.reduce((sum, i) => {
    const prev = (i.prevCost && i.prevCost > i.cost) ? i.prevCost : i.cost;
    const worst = i.maxPrice ? Math.max(prev, i.maxPrice) : prev;
    return sum + worst * i.quantity;
  }, 0);
  const totalSavings = worstCaseTotal - total;
  const savingsPct = worstCaseTotal > 0 ? Math.round((totalSavings / worstCaseTotal) * 100) : 0;

  // Discount savings: prevCost vs cost
  const totalWithoutDiscount = items.reduce((sum, i) => {
    const orig = (i.prevCost && i.prevCost > i.cost) ? i.prevCost : i.cost;
    return sum + orig * i.quantity;
  }, 0);
  const discountSavings = totalWithoutDiscount - total;

  // Cross-store savings
  const crossStoreSavings = items.reduce((sum, i) => {
    if (i.maxPrice && i.maxPrice > i.cost) return sum + (i.maxPrice - i.cost) * i.quantity;
    return sum;
  }, 0);
  const comparedItems = items.filter(i => i.maxPrice && i.maxPrice > i.cost).length;
  const uniqueStores = Object.keys(byStore);

  const [showFrozenModal, setShowFrozenModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowFrozenModal(true);
  };

  return (
    <div className={s.page}>
      {showFrozenModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => setShowFrozenModal(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:'32px 28px',maxWidth:360,textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:12}}>🚫</div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Рустам сказал пока нельзя</h2>
            <p style={{color:'#888',fontSize:14,marginBottom:20}}>Функция оформления заказа временно отключена</p>
            <button onClick={() => setShowFrozenModal(false)} style={{background:'#009DE0',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontSize:15,fontWeight:600,cursor:'pointer'}}>Понятно</button>
          </div>
        </div>
      )}
      <div className={s.headerRow}>
        <Link to="/cart" className={s.backLink}>
          <Icon name="chevron-left" size={20} />
          <span>Корзина</span>
        </Link>
      </div>
      <h1 className={s.title}>Оформление заказа</h1>

      <div className={s.layout}>
        {/* Left: Form */}
        <form className={s.formCol} onSubmit={handleSubmit}>
          {/* Delivery Address */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              <Icon name="map-pin" size={20} />
              Адрес доставки
            </h2>
            <div className={s.field}>
              <label className={s.label}>Адрес *</label>
              <div className={s.addressWrapper}>
                <input
                  ref={addressInputRef}
                  className={`${s.input} ${selectedPlaceId ? s.inputConfirmed : ''}`}
                  type="text"
                  placeholder="Начните вводить адрес..."
                  value={address}
                  onChange={handleAddressChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  required
                />
                {loadingSuggestions && (
                  <span className={s.inputSpinner}></span>
                )}
                {selectedPlaceId && (
                  <span className={s.inputCheck}>
                    <Icon name="check-circle" size={18} />
                  </span>
                )}
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className={s.suggestions} ref={suggestionsRef}>
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        className={s.suggestionItem}
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <Icon name="map-pin" size={16} className={s.suggestionIcon} />
                        <div className={s.suggestionText}>
                          <span className={s.suggestionMain}>{suggestion.mainText}</span>
                          <span className={s.suggestionSecondary}>{suggestion.secondaryText}</span>
                        </div>
                      </button>
                    ))}
                    <div className={s.suggestionsFooter}>
                      <span>powered by</span>
                      <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_74x24dp.png" alt="Google" height="12" />
                    </div>
                  </div>
                )}
              </div>
              {!selectedPlaceId && address.length >= 3 && !loadingSuggestions && suggestions.length === 0 && (
                <div className={s.addressHint}>
                  <Icon name="info" size={14} />
                  <span>Выберите адрес из подсказок для точной доставки</span>
                </div>
              )}
            </div>
            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.label}>Квартира</label>
                <input className={s.input} type="text" placeholder="12" value={apartment} onChange={e => setApartment(e.target.value)} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Подъезд</label>
                <input className={s.input} type="text" placeholder="1" value={entrance} onChange={e => setEntrance(e.target.value)} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Этаж</label>
                <input className={s.input} type="text" placeholder="3" value={floor} onChange={e => setFloor(e.target.value)} />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Комментарий курьеру</label>
              <textarea
                className={s.textarea}
                placeholder="Домофон не работает, звоните на телефон"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
              />
            </div>
            
            {/* Delivery status */}
            {address.length >= 5 && (
              <div className={s.deliveryStatus}>
                {checkingDelivery ? (
                  <div className={s.deliveryChecking}>
                    <span className={s.spinner}></span>
                    <span>Проверяем доступность доставки...</span>
                  </div>
                ) : deliveryInfo?.stores ? (
                  <div className={s.deliveryResults}>
                    {Object.entries(deliveryInfo.stores).map(([store, info]) => (
                      <div 
                        key={store} 
                        className={`${s.deliveryStore} ${info.available ? s.deliveryAvailable : s.deliveryUnavailable}`}
                      >
                        {STORE_ICONS[store] ? (
                          <img className={s.deliveryStoreLogo} src={STORE_ICONS[store]} alt={store} />
                        ) : (
                          <span className={s.deliveryStoreName}>{store}</span>
                        )}
                        {info.available ? (
                          <>
                            <Icon name="check-circle" size={16} className={s.deliveryOk} />
                            <div className={s.deliveryDetails}>
                              <span className={s.deliveryText}>
                                {info.deliveryFee > 0 
                                  ? `Доставка: ${info.deliveryFee.toLocaleString()} ₸`
                                  : 'Бесплатная доставка'}
                                {info.deliveryTime && ` · ${info.deliveryTime}`}
                              </span>
                              {info.minOrderAmount > 0 && (
                                <span className={s.deliveryMin}>
                                  Мин. заказ: {info.minOrderAmount.toLocaleString()} ₸
                                </span>
                              )}
                              {info.statusMessage && (
                                <span className={s.deliveryNote}>{info.statusMessage}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Icon name="alert-circle" size={16} className={s.deliveryNo} />
                            <div className={s.deliveryDetails}>
                              <span className={s.deliveryText}>
                                {info.statusMessage || info.error || 'Недоступно'}
                              </span>
                              {info.nextAvailableSlot && (
                                <span className={s.deliveryNote}>
                                  Ближайший слот: {info.nextAvailableSlot}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : deliveryError ? (
                  <div className={s.deliveryError}>
                    <Icon name="alert-circle" size={16} />
                    <span>{deliveryError}</span>
                  </div>
                ) : null}
              </div>
            )}
            
            {/* Delivery Type Selection */}
            {deliveryInfo?.stores && Object.values(deliveryInfo.stores).some(s => s.available) && (
              <div className={s.deliveryTypeSection}>
                <h3 className={s.deliveryTypeTitle}>Когда доставить?</h3>
                <div className={s.deliveryTypes}>
                  {/* Standard Delivery */}
                  {Object.values(deliveryInfo.stores).some(s => s.isOnline && s.hasStandardDelivery) && (
                    <label className={`${s.deliveryTypeOption} ${deliveryType === 'standard' ? s.deliveryTypeSelected : ''}`}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="standard"
                        checked={deliveryType === 'standard'}
                        onChange={() => { setDeliveryType('standard'); setSelectedTimeSlot(null); }}
                      />
                      <div className={s.deliveryTypeContent}>
                        <Icon name="zap" size={20} />
                        <div className={s.deliveryTypeInfo}>
                          <span className={s.deliveryTypeName}>Стандартная</span>
                          <span className={s.deliveryTypeTime}>
                            {Object.values(deliveryInfo.stores).find(s => s.isOnline)?.deliveryTime || '25-40 мин'}
                          </span>
                        </div>
                        <span className={s.deliveryTypePrice}>
                          {Object.values(deliveryInfo.stores).find(s => s.isOnline)?.deliveryFee > 0
                            ? `${Object.values(deliveryInfo.stores).find(s => s.isOnline)?.deliveryFee} ₸`
                            : 'Бесплатно'}
                        </span>
                      </div>
                    </label>
                  )}
                  
                  {/* Scheduled Delivery */}
                  {Object.values(deliveryInfo.stores).some(s => s.hasScheduledDelivery && s.scheduledSlots?.length > 0) && (
                    <label className={`${s.deliveryTypeOption} ${deliveryType === 'scheduled' ? s.deliveryTypeSelected : ''}`}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="scheduled"
                        checked={deliveryType === 'scheduled'}
                        onChange={() => setDeliveryType('scheduled')}
                      />
                      <div className={s.deliveryTypeContent}>
                        <Icon name="calendar" size={20} />
                        <div className={s.deliveryTypeInfo}>
                          <span className={s.deliveryTypeName}>Запланированная</span>
                          <span className={s.deliveryTypeTime}>Выберите время</span>
                        </div>
                        <span className={s.deliveryTypePrice}>Бесплатно</span>
                      </div>
                    </label>
                  )}
                </div>
                
                {/* Time Slot Selection */}
                {deliveryType === 'scheduled' && (
                  <div className={s.timeSlots}>
                    {Object.values(deliveryInfo.stores).find(s => s.scheduledSlots?.length > 0)?.scheduledSlots?.map((daySlots, idx) => (
                      <div key={idx} className={s.timeSlotsDay}>
                        <span className={s.timeSlotsLabel}>{daySlots.day}</span>
                        <div className={s.timeSlotsList}>
                          {daySlots.slots.map((slot, slotIdx) => (
                            <button
                              key={slotIdx}
                              type="button"
                              className={`${s.timeSlot} ${selectedTimeSlot === `${daySlots.day}-${slot}` ? s.timeSlotSelected : ''}`}
                              onClick={() => setSelectedTimeSlot(`${daySlots.day}-${slot}`)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Contact */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              <Icon name="user" size={20} />
              Контактные данные
            </h2>
            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.label}>Имя *</label>
                <input className={s.input} type="text" placeholder="Ваше имя" value={contactName} onChange={e => setContactName(e.target.value)} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Телефон *</label>
                <input className={s.input} type="tel" placeholder="+7 (___) ___-__-__" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              <Icon name="credit-card" size={20} />
              Способ оплаты
            </h2>
            <div className={s.paymentOptions}>
              <label className={`${s.paymentOption} ${s.paymentOptionActive}`}>
                <input type="radio" name="payment" value="card" checked readOnly className={s.radioHidden} />
                <div className={s.paymentIcon}>💳</div>
                <div>
                  <div className={s.paymentLabel}>Картой</div>
                  <div className={s.paymentDesc}>Оплата картой при оформлении заказа</div>
                </div>
              </label>
            </div>
          </section>

          {error && <div className={s.error}><Icon name="alert-circle" size={16} /> {error}</div>}

          <button className={s.submitBtn} type="submit" disabled={loading || checkingDelivery}>
            {loading ? (
              <span>Оформляем заказ...</span>
            ) : checkingDelivery ? (
              <span>Проверяем доставку...</span>
            ) : (
              <>
                <Icon name="check" size={20} />
                <span>Оформить заказ — {grandTotal.toLocaleString()} ₸</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Order Summary */}
        <aside className={s.summaryCol}>
          <div className={s.summary}>
            <h2 className={s.summaryTitle}>Ваш заказ ({totalCount})</h2>

            {storeGroups.map(group => (
              <div key={group.store} className={s.storeGroup}>
                <div className={s.storeHeader}>
                  {STORE_ICONS[group.store]
                    ? <img className={s.storeLogo} src={STORE_ICONS[group.store]} alt={group.storeName} />
                    : <div className={s.storeDot} style={{ background: STORE_COLORS[group.store] }}>{group.storeName[0]}</div>
                  }
                  <span className={s.storeName}>{group.storeName}</span>
                  <span className={s.storeSubtotal}>{group.subtotal.toLocaleString()} ₸</span>
                </div>
                <div className={s.storeItems}>
                  {group.items.map(item => (
                    <div key={item._id} className={s.summaryItem}>
                      <img
                        className={s.summaryItemImg}
                        src={item.imageUrl?.replace('%w', '64').replace('%h', '64')}
                        alt=""
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div className={s.summaryItemInfo}>
                        <div className={s.summaryItemTitle}>{item.title}</div>
                        <div className={s.summaryItemMeta}>{item.quantity} × {item.cost.toLocaleString()} ₸</div>
                      </div>
                      <div className={s.summaryItemPrice}>{(item.cost * item.quantity).toLocaleString()} ₸</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── Savings Dashboard ── */}
            {totalSavings > 0 && (
              <div className={s.savingsDash}>
                <div className={s.savingsDashHeader}>
                  <div className={s.savingsIconCircle}>
                    <Icon name="trending-up" size={20} />
                  </div>
                  <div>
                    <div className={s.savingsDashTitle}>Экономия с FreshScout</div>
                    <div className={s.savingsDashSub}>
                      Лучшие цены из {uniqueStores.length} магазинов
                    </div>
                  </div>
                  <div className={s.savingsBigAmount}>−{totalSavings.toLocaleString()} ₸</div>
                </div>

                <div className={s.savingsBarWrap}>
                  <div className={s.savingsBarLabels}>
                    <span>Без FreshScout — {worstCaseTotal.toLocaleString()} ₸</span>
                    <span className={s.savingsBarPct}>−{totalSavings.toLocaleString()} ₸</span>
                  </div>
                  <div className={s.savingsBarTrack}>
                    <div className={s.savingsBarFill} style={{ width: `${100 - savingsPct}%` }} />
                    <div className={s.savingsBarSaved} style={{ width: `${savingsPct}%` }} />
                  </div>
                  <div className={s.savingsBarLabels}>
                    <span className={s.savingsBarYou}>С FreshScout — {total.toLocaleString()} ₸</span>
                  </div>
                </div>

                <div className={s.savingsChips}>
                  {discountSavings > 0 && (
                    <div className={s.savingsChip}>
                      <Icon name="tag" size={13} />
                      <span>Скидки: −{discountSavings.toLocaleString()} ₸</span>
                    </div>
                  )}
                  {crossStoreSavings > 0 && (
                    <div className={s.savingsChip}>
                      <Icon name="search" size={13} />
                      <span>Сравнение: −{crossStoreSavings.toLocaleString()} ₸</span>
                    </div>
                  )}
                  {comparedItems > 0 && (
                    <div className={s.savingsChip}>
                      <Icon name="check" size={13} />
                      <span>{comparedItems} из {items.length} — лучшая цена</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery fees */}
            {deliveryFees > 0 && (
              <div className={s.deliveryFeesRow}>
                <span>Доставка</span>
                <span>{deliveryFees.toLocaleString()} ₸</span>
              </div>
            )}

            <div className={s.totalRow}>
              <span>Итого</span>
              <span>{grandTotal.toLocaleString()} ₸</span>
            </div>

            {/* Facts bar */}
            <div className={s.factBar}>
              <div className={s.factItem}>
                <div className={s.factIcon}><Icon name="search" size={16} /></div>
                <div className={s.factText}>
                  <strong>5 магазинов</strong>
                  <span>сравнили</span>
                </div>
              </div>
              <div className={s.factDivider} />
              <div className={s.factItem}>
                <div className={s.factIcon}><Icon name="cart" size={16} /></div>
                <div className={s.factText}>
                  <strong>{uniqueStores.length} {uniqueStores.length === 1 ? 'магазин' : uniqueStores.length < 5 ? 'магазина' : 'магазинов'}</strong>
                  <span>в заказе</span>
                </div>
              </div>
              <div className={s.factDivider} />
              <div className={s.factItem}>
                <div className={s.factIcon}><Icon name="trending-up" size={16} /></div>
                <div className={s.factText}>
                  <strong>{totalSavings > 0 ? `−${totalSavings.toLocaleString()} ₸` : 'Лучшие цены'}</strong>
                  <span>{totalSavings > 0 ? 'экономия' : 'найдены'}</span>
                </div>
              </div>
            </div>

            <div className={s.deliveryNote}>
              <Icon name="package" size={16} />
              <span>
                {storeGroups.length > 1
                  ? `Доставка из ${storeGroups.length} магазинов — каждый доставляет отдельно`
                  : 'Доставка из 1 магазина'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
