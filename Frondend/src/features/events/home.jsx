


function Home() {
  return (
    <div className="main-content">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h2>DASHBOARD</h2>
        <div className="user-profile-top">Staff - Food Dept</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Task Card 1 */}
        <div className="stat-card">
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginRight: '15px' }}>14</div>
          <div>
            <strong>Shipments Due</strong>
            <p style={{ color: '#666', margin: 0 }}>4 High Priority</p>
          </div>
          <div style={{ marginLeft: 'auto', opacity: 0.5 }}>🚚</div>
        </div>

        {/* Task Card 2 */}
        <div className="stat-card">
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginRight: '15px' }}>26</div>
          <div>
            <strong>Expiring Soon</strong>
            <p style={{ color: '#666', margin: 0 }}>Within 7 Days</p>
          </div>
          <div style={{ marginLeft: 'auto', opacity: 0.5 }}>📅</div>
        </div>
      </div>
    </div>
  );
}
export default Home;