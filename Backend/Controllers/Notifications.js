const getNotifications = (req, res) => {
  // Logic to fetch notifications for the user
  const notifications = [
    { id: 1, message: "Your order has been shipped." },
    { id: 2, message: "New login from unrecognized device." },
  ];
  res.render("Notification", { notifications });
};

module.exports = {
  getNotifications,
};
