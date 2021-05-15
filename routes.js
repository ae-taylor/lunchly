"use strict";

/** Routes for Lunchly */

const express = require("express");
//make sure no unused errors are imported here

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  const customers = await Customer.all();
  //may have to loop through customers
  return res.render("customer_list.html", { customers });
});


/** Show list of top 10 customers who have at least one reservation */

router.get("/top", async function (req, res, next) {
  try {
    const customers = await Customer.getTopTenCustomers();
    customers.prefix = "Top";
    //console.log("success condition in top 10 route ran, customers is", customers);
    return res.render("customer_list.html", { customers });
  } catch (err) {
    err.status = 404;
    err.message = "No top customers yet";
    return res.render("error.html", { err });
  }
});
//minimize number of try/catches here
//instead of all of this, we could just put the logic into the template where,
//if the array is empty, we just display something else


/** Show list of customers matching searched name */

router.get("/search", async function (req, res, next) {
  const name = req.query.name;
  //console.log(req.query.name)
  try {
    const customers = await Customer.searchCustomers(name);
    return res.render("customer_list.html", { customers })
  } catch (err) {
    err.status = 404;
    err.message = "Customer not found.";
    console.log("route error is", err);
    return res.render("error.html", { err });
  }
});
//same as above
//try/catch is built in from express via the global error handler in app.js
//so we don't explicitly NEED to add try/catch statements here

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});


/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


/**Placeholder favicon function to make the browser happy */

router.get('/favicon.ico', function (req, res, next) {
  return res.send('')
})
//there are some libraries in express that can handle this for us

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});


/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});


/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

module.exports = router;
