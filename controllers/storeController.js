exports.homePage = (req, res) => {
    res.render('index', {
        title: 'YELP V2'
    });
};

//note: we'll use same template whether we add or edit store
exports.addStore = (req, res) => {
    res.render('editStore', {
        title: 'Add Store'
    });
};

//after user submits form, send res back as JSON
exports.createStore = (req, res) => {
    res.json(req.body);
};