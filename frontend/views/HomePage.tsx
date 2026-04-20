'use client';

import { useState, useEffect } from 'react';

type User = {
  id: number;
  name: string;
  loyaltyTier: string;
  loyaltyPoints: number;
};

type Flight = {
  id: number;
  flightNumber: string;
  origin: string;
  destination: string;
  basePriceEx: number;
  basePriceBz: number;
  economySeatsAvailable: number;
  businessSeatsAvailable: number;
  isEconomyOverbooked: boolean;
  isBusinessFull: boolean;
};

type Booking = {
  id: number;
  flight: Flight;
  status: string;
  fareClass: string;
}

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'upgrade';
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });

  const loadData = async (uid?: number) => {
    setLoading(true);
    const userId = uid || activeUserId;
    try {
      const uRes = await fetch('/api/users');
      const uData = await uRes.json();
      setUsers(uData);
      
      const setUid = userId || (uData.length > 0 ? uData[0].id : null);
      if (!activeUserId && setUid) setActiveUserId(setUid);

      const [fRes, bRes] = await Promise.all([
        fetch('/api/flights'),
        setUid ? fetch(`/api/bookings?userId=${setUid}`) : Promise.resolve({ json: () => [] })
      ]);

      const fData = await fRes.json();
      setFlights(fData);

      const bData = await bRes.json();
      setBookings(bData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  useEffect(() => {
    if (activeUserId) loadData(activeUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  const showToast = (message: string, type: 'success' | 'error' | 'upgrade') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  const handleBook = async (flightId: number, requestedClass: string) => {
    if (!activeUserId) return;
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, flightId, requestedClass })
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(data.error, 'error');
      } else {
        if (data.upgradeMessage) {
          showToast(data.upgradeMessage, 'upgrade');
        } else if (data.booking.status === 'WAITLISTED') {
          showToast('Added to waitlist. Sector is fully booked.', 'error');
        } else {
          showToast(`Seat Confirmed in ${data.booking.fareClass}!`, 'success');
        }
        loadData(); // refresh availability and bookings
      }
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    }
  };

  const handleCancel = async (bookingId: number) => {
    try {
      const res = await fetch('/api/cancel', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
         showToast('Booking cancelled successfully', 'success');
         loadData();
      }
    } catch(e) {
      showToast('Error cancelling booking.', 'error');
    }
  };

  const activeUser = users.find(u => u.id === activeUserId);

  return (
    <>
      <nav className="nav">
        <div className="brand">✈️ RaahLink</div>
        <div>
          {users.length > 0 && (
            <select 
              className="user-selector"
              value={activeUserId || ''} 
              onChange={e => setActiveUserId(Number(e.target.value))}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  👤 {u.name} ({u.loyaltyTier})
                </option>
              ))}
            </select>
          )}
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <h1>Where to next, {activeUser?.name.split(' ')[0] || 'Traveler'}?</h1>
          <p>Book your luxurious getaway. Experience seamless upgrades.</p>
        </section>

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="flights-grid">
            {flights.map(flight => (
              <div key={flight.id} className="flight-card">
                <div className="flight-header">
                  <div className="flight-number">{flight.flightNumber}</div>
                  <div className="flight-status">
                    {flight.isEconomyOverbooked && flight.isBusinessFull ? (
                      <span className="tag tag-full">Sold Out</span>
                    ) : flight.isEconomyOverbooked ? (
                      <span className="tag tag-overbooked">Overbooked</span>
                    ) : (
                      <span className="tag tag-available">Available</span>
                    )}
                  </div>
                </div>

                <div className="flight-route">
                  <div className="route-point">
                    <h3>{flight.origin.split(' ')[0]}</h3>
                    <p>{flight.origin}</p>
                  </div>
                  <div className="route-icon">✈</div>
                  <div className="route-point" style={{ textAlign: 'right' }}>
                    <h3>{flight.destination.split(' ')[0]}</h3>
                    <p>{flight.destination}</p>
                  </div>
                </div>

                <div className="seat-options">
                  <div className="seat-class">
                    <div className="seat-info">
                      <h4>Economy Class</h4>
                      <p>
                        {flight.economySeatsAvailable} seats remaining
                      </p>
                    </div>
                    <div>
                      <div className="price">₹{flight.basePriceEx.toLocaleString()}</div>
                      <button 
                         className="book-btn"
                         onClick={() => handleBook(flight.id, 'ECONOMY')}
                      >
                        Book Economy
                      </button>
                    </div>
                  </div>

                  <div className="seat-class">
                    <div className={`seat-info ${activeUser?.loyaltyTier === 'GOLD' || activeUser?.loyaltyTier === 'PLATINUM' ? 'gold' : ''}`}>
                      <h4>Business Class</h4>
                      <p>
                        {flight.businessSeatsAvailable} seats remaining
                      </p>
                    </div>
                    <div>
                      <div className="price">₹{flight.basePriceBz.toLocaleString()}</div>
                      <button 
                         className="book-btn"
                         onClick={() => handleBook(flight.id, 'BUSINESS')}
                      >
                        Book Business
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <section className="bookings-section">
            <h2>My Reservations</h2>
            <div className="flights-grid">
              {bookings.map(booking => (
                <div key={booking.id} className="flight-card">
                   <div className="flight-header">
                     <div className="flight-number">Booking #{booking.id}</div>
                     <span className={`tag ${booking.status === 'CANCELLED' ? 'tag-full' : booking.status === 'WAITLISTED' ? 'tag-overbooked' : 'tag-available'}`}>
                        {booking.status}
                     </span>
                   </div>
                   <div className="flight-route">
                      <div className="route-point">
                        <h3>{booking.flight.origin.split(' ')[0]}</h3>
                        <p>{booking.flight.flightNumber}</p>
                      </div>
                      <div className="route-icon">✈</div>
                      <div className="route-point" style={{ textAlign: 'right' }}>
                        <h3>{booking.flight.destination.split(' ')[0]}</h3>
                        <p>Class: {booking.fareClass}</p>
                      </div>
                   </div>
                   {booking.status !== 'CANCELLED' && (
                     <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                       Cancel Reservation
                     </button>
                   )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {toast.visible && (
        <div className={`toast toast-${toast.type}`}>
          <strong>
            {toast.type === 'success' ? '✅ Success' : toast.type === 'error' ? '⚠️ Alert' : '🌟 Upgrade Alert'}
          </strong>
          <p>{toast.message}</p>
        </div>
      )}
    </>
  );
}
