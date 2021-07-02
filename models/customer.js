"use strict";

//TODO - todos included in comments in this file

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }


  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /**  
   * gets the 10 customers who have had the most
   * reservations (if they've had at least 1 reservation)
   * otherwise, throws error
  */

  static async getTopTenCustomers() {
    const results = await db.query(
      `SELECT customers.id,
                 customers.first_name as "firstName",
                 customers.last_name as "lastName",
                 count(reservations.id) as res_count 
          FROM customers
          JOIN reservations 
          ON customers.id = reservations.customer_id 
          GROUP BY customers.id, customers.first_name, customers.last_name
          HAVING count(reservations.id) > 0 
          ORDER BY res_count desc
          LIMIT 10;`
    ); // TODO having clause isn't necessary w inner join, both conditions must be met
    const customers = results.rows;
    console.log("top10queryresults", customers, customers.length);

    if (customers.length === 0) {
      const err = new Error(`No customers fulfilling condition.`);//
      err.status = 404;// TODO maybe don't need a 404 here, an empty array would maybe be more clear
      throw err;
    }

    return customers.map(c => new Customer(c));

  }


  /** return customers whose first or last name
   * match searched name 
   */

  static async searchCustomers(name) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE LOWER(CONCAT(first_name, ' ', last_name)) ilike $1`,
           // TODO CONCAT ignores null values-- if we pass undefined into it somehow, 
           //CONCAT will make this an empty string

      ['%' + name + '%'], // could use string interpolation with `` instead
    );

    const customers = results.rows
    //if no results returned to customers array, throw error
    if (customers.length === 0) { //don't necessary need to throw an error, just the empty result
      const err = new Error(`not found: ${name}`);
      err.status = 404;
      throw err;
    }

    return customers.map(c => new Customer(c));
  }


  /** return full name (first name concat with last name) */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }


  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;
