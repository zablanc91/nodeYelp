import axios from 'axios';
import dompurify from 'dompurify';

//helper, given array of Stores from matched term in search bar, returns HTML to displayed
function searchResultsHTML(stores){
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}

function typeAhead(search){
    if(!search)
        return;

    //input is child of search div, has name of "search"
    const searchInput = search.querySelector('input[name="search"]');

    //search results to be displayed in child div, hidden by default
    const searchResults = search.querySelector('.search__results');

    //wait for something to be typed into search bar
    searchInput.addEventListener('input', function() {
        if(!this.value){
            searchResults.style.display = 'none';
            return;
        }

        //go to API endpoint and pull stores that match search
        searchResults.style.display = 'block';
        
        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                if(res.data.length){
                    //turn array of stores into HTML then display
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return;
                }

                //state no results found for the search term
                searchResults.innerHTML = dompurify.sanitize(`
                    <div class='search__result'>
                        No results found for ${this.value}
                    </div>`);

            })
            .catch(err => {
                console.error(err);
            });

    });

    //for keyboard inputs
    searchInput.addEventListener('keyup', (e) => {
        //down = 40 up = 38, enter = 13; will ignore other keypresses
        if(![38, 40, 13].includes(e.keyCode)){
            return;
        }
        
        //restrict up presses on 1st result and down presses on last 
        const activeClass = 'search__result--active';
        const currentResult = search.querySelector(`.${activeClass}`);
        const results = search.querySelectorAll('.search__result');

        let next;
        if(e.keyCode === 40 && currentResult){
            //go down or loop back to 1st
            next = currentResult.nextElementSibling || results[0];
        }
        else if(e.keyCode === 40){
            //first time pressing down key
            next = results[0];
        }
        else if(e.keyCode === 38 && currentResult){
            //go up or loop back to last
            next = currentResult.previousElementSibling || results[results.length - 1];
        }
        else if(e.keyCode === 38){
            //first time pressing up key
            next = results[results.length - 1];
        }
        else if(e.keyCode === 13 && currentResult.href){
            //press enter with a result highlighted
            window.location = currentResult.href; 
            return;       
        }
        
        //now that have next, set it to be active; also need to remove prev result with active
        if(currentResult){
            currentResult.classList.remove(activeClass);
        }
        next.classList.add(activeClass);
    });
}

export default typeAhead;