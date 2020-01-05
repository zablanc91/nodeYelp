import axios from 'axios';

//default options, goes to Hamilton, Canada
const mapOptions = {
    center: {
        lat: 43.2,
        lng: -79.8
    },
    zoom: 11
};

function loadPlaces(map, lat = 43.2, lng = -79.8){
    //hit the API endpoint, returns array of nearby stores
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then( res => {
            const places = res.data;

            if(places.length === 0){
                alert('No places found!');
                return;
            }

            //make a bounds to zoom out and include all markers in view
            const bounds = new google.maps.LatLngBounds();

            const infoWindow = new google.maps.InfoWindow();

            const markers = places.map(place => {
                //returned stores from our DB is in lng, lat format
                const[placeLng, placeLat] = place.location.coordinates;
                const position = {lat: placeLat, lng: placeLng};
                bounds.extend(position);
                //make marker, put it on our map and put it @ position
                const marker = new google.maps.Marker({
                    map,
                    position
                });

                //attach place data to marker to display info on click
                marker.place = place;
                return marker;
            });

            //display info window after clicking a marker
            markers.forEach(marker => {
                marker.addListener('click', function(){
                    const html = `
                        <div class="popup">
                            <a href="/store/${this.place.slug}" >
                                <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
                                <p> ${this.place.name} - ${this.place.location.address} </p>
                            </a>
                        </div>
                    `;
                    infoWindow.setContent(html);
                    infoWindow.open(map, this);
                });
            });

            //fix zoom after markers displayed
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
        });
}

function makeMap(mapDiv){
    //only available in map page of our app
    if(!mapDiv)
        return;

    //make the map, 1st arg: where should it go, 2nd: options
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadPlaces(map);

    const input = document.querySelector('.autocomplete__input');
    const autocomplete = new google.maps.places.Autocomplete(input);

    //read the address in input then rerun loadPlaces
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        //coordinates stored in geometry.location.lat/lng()
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    });
}

export default makeMap;