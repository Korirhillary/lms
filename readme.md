## Library management system ##
This is a basic library management system that has these features:

     1.Books - View and search books, check stock, and see availability.
     2.Members  - View member information and outstanding debts.
     3.Transactions - View transaction history with issue/return dates and charges.
     4.Dashboard - Displays overall library statistics and quick links to manage books, members and transactions.

## Tools and technologies used

   1.Backend - Python (Flask)
   2.Frontend - Javascript (React)
   3.Database - SQLite

## Backend
The backend is built with Flask with SQLite storing the data.

## Setting Up Tests
This project uses:
 1. Pytest - Testing framework. 
 2. Flask testing - For unit testing

 ## Install Testing Dependencies
To install dependencies run this command:
 
 ```sh
  pip install pytest flask-testing
```

## Running Tests
To run the tests, use the following command:

```sh
pytest
```
       ![LMS](./docs/backend%20tests.png)


## Frontend
The frontend is built with React and Plain CSS.
    
## Installing Testing Libraries
To write and run tests, we will use the following libraries:
  1. Jest - Testing framework.
  2. React testing library - For unit testing 

  ## Install Testing Dependencies
  To install dependencies run the following command:

```sh
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```   

## Running Tests
To run the tests, use the following command:

```sh
npm test
```         

         ![LMS](./docs/frontend%20tests.png)