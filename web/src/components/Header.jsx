
function Header({ signOut }) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-10">
          <h2>Pet Tracking Map</h2>
        </div>
        <div className="col-2">
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  )
};

export default Header;