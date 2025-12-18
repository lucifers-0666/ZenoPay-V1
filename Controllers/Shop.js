const getShop = (req, res) => {
    // This simulates an external merchant website
    res.render("shop");
};

module.exports = {
    getShop
};