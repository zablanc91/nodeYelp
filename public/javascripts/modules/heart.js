import axios from 'axios';

function ajaxHeart(e){
    //prevent default, which is form from submitting itself with POST
    e.preventDefault();

    //'this' is the form calling ajaxHeart through event listener
    //action is `/api/stores/${store._id}/heart` 
    axios
        .post(this.action)
        .then(res => {
            //heart property is the 'name' of the button inside form
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            document.querySelector('.heart-count').textContent = res.data.hearts.length;

            //add a little animation and then remove class afterwards (hearts.scss)
            if(isHearted){
                this.heart.classList.add('heart__button--float');
                setTimeout(() => this.heart.classList.remove('heart__button--float'), 2000);
            }
        })
        .catch(console.error);
}

export default ajaxHeart;