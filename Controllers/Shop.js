const getShop = (req, res) => {
    // This simulates an external merchant website
    res.render("shop", {
        pageTitle: "Gadget World - Demo Merchant",
        // Pass any pre-filled key if available in query for easier testing
        prefillKey: req.query.key || "" 
    });
};

module.exports = {
    getShop
};