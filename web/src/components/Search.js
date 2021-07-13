import { useState } from 'react';

const indexName = 'PetTrackerIndex';

function Search(props){
    // console.log('Search props >>> ', props);
    const client = props.client;
    const setViewport = props.setViewport;
    const setMarker = props.setMarker;

    const searchPlace = (place) => {
        // console.log('in searchPlace, place >>> ', place);
        const params = {
            IndexName: indexName,
            Text: place,
        };
    
        client.searchPlaceIndexForText(params, (err, data) => {
            // console.log('in searchPlaceIndexForText, data >>> ', data);
            if (err) console.error(err);
            if (data) {
    
            const coordinates = data.Results[0].Place.Geometry.Point;
            // console.log('in searchPlaceIndexForText, coordinates >>> ', coordinates);

            setViewport({
                longitude: coordinates[0],
                latitude: coordinates[1], 
                zoom: 10});
    
            setMarker({
                longitude: coordinates[0],
                latitude: coordinates[1],                 
            })
            return coordinates;
            }
        });
    }

    const [place, setPlace] = useState('Vancouver');
   
    const handleChange = (event) => {
      setPlace(event.target.value);
    }
  
    const handleClick = (event) => {
      event.preventDefault();
      searchPlace(place)
    }
    
    return (
      <div className="container">
        <div className="input-group">
          <input type="text" className="form-control form-control-lg" placeholder="Search for Places" aria-label="Place" aria-describedby="basic-addon2" value={ place } onChange={handleChange}/>
          <div className="input-group-append">
            <button onClick={ handleClick } className="btn btn-primary" type="submit">Search</button>
          </div>
        </div>
      </div>
    );

  };

  export default Search;