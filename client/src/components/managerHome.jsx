import React from 'react';
import axios from 'axios';
import moment from 'moment';
import ReactTable from 'react-table';
import Select from 'react-select';
import Navigation from './managerNav.jsx';
import Navbar from './navbar.jsx';
import ManagerHomeBar from './managerHomeBar.jsx';
import socket from '../socket.js';


const columns =
[
  {
    Header: 'Currently Clocked In',
    columns: [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Clock In',
        accessor: 'clockIn',
      },
    ],
  },
];
class ManagerHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allEmployees: [],
      allSales: [],
      totalSales: 0,
      allIngredients: [],
      tableData: [],
      dropdownOptions: [],
      lowStockPercent: 20,
    };
    this.getAllClockedIn = this.getAllClockedIn.bind(this);
    this.getAllSalesToday = this.getAllSalesToday.bind(this);
    this.getLowInventory = this.getLowInventory.bind(this);
    this.percentageDropdownOptions = this.percentageDropdownOptions.bind(this);
    this.initSocket = this.initSocket.bind(this);
  }

  componentDidMount() {
    this.initSocket();
    this.getAllClockedIn();
    this.getAllSalesToday();
    this.getLowInventory();
    this.percentageDropdownOptions();
  }

  initSocket() {
    socket.on('madeSale', (total) => {
      console.log('socketsocketsocketsocketsocketsocketsocketsocket')
      console.log(total, typeof total, this.state.totalSales, typeof this.state.totalSales)
      this.setState({ totalSales: parseFloat(this.state.totalSales) + parseFloat(total.total) });
    })
  }

  getAllClockedIn() {
    axios.get('/fetch/allEmployees/clockedIn')
      .then((results) => {
        this.setState({
          allEmployees: results.data[0],
        });
      })
      .then(() => {
        const tableData = [];
        this.state.allEmployees.forEach((employee) => {
          tableData.push({
            name: employee.employee_name,
            clockIn: employee.check_in,
          });
        });
        this.setState({
          tableData,
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  getAllSalesToday() {
    axios.get('/fetch/allSales/today')
      .then((results) => {
        let todaySales = [];
        results.data.forEach((result) => {
          let saleDate = moment(result.sale_date).format('MM DD YYYY');
          let todayDate = moment().format('MM DD YYYY');
          if (saleDate === todayDate) {
            todaySales.push(result);
          }
        });
        let totalAmount = 0;
        todaySales.forEach((sale) => {
          totalAmount += parseFloat(sale.sale_amount);
        })
        this.setState({
          allSales: todaySales,
          totalSales: totalAmount.toFixed(2)
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  getLowInventory() {
    axios.get('/fetch/inventory')
      .then((results) => {
        this.setState({
          allIngredients: results.data,
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  percentageDropdownOptions() {
    const dropdownOptions = [];
    for (let i = 5; i <= 100; i += 5) {
      dropdownOptions.push({ value: i, label: `${i}% in Stock` });
    }
    this.setState({
      dropdownOptions,
    });
  }

  render() {
    const lowIngredients = [];
    this.state.allIngredients.forEach((ingredient) => {
      if ((parseFloat(ingredient.ingredient_left).toFixed(2) / parseFloat(ingredient.ingredient_initial).toFixed(2) * 100) <= this.state.lowStockPercent) {
        lowIngredients.push(ingredient);
      }
    });
    return (
      <div>
        <div>
          <Navbar />
        </div>
        <div className="managerScreenGrid-home">
          <div className="manager-navigation"><Navigation /></div>
          <div id="card" className="managerCard-1">
            <h1>{this.state.allEmployees.length}</h1>
            <h2>Clocked In</h2>
          </div>
          <div id="card" className="managerCard-2">
            <h1>{this.state.allSales.length}</h1>
            <h2>Total Transactions</h2>
          </div>
          <div id="card" className="managerCard-3">
            <h1><i className="fas fa-dollar-sign" /> {this.state.totalSales}</h1>
            <h2>Total Sales</h2>
          </div>
          <div id="card" className="managerCard-4">
            {
              lowIngredients.length > 0
              ?
              lowIngredients.map(ingredient =>
                (<h6><i className='fas fa-exclamation-circle' /> {ingredient.ingredient_name} </h6>))
              :
              (<h2 style={{ gridRow: '3', gridColumn: '1 / 6' }}><i className='fas fa-thumbs-up' /> No Low Ingredients</h2>)
            }
            <div style={{ gridRow: '1', gridColumn: '1 / 6', color: 'black' }}>
              <Select
                placeholder='Choose a Low Stock Percentage, default is set to 20%'
                options={this.state.dropdownOptions}
                matchProp="any"
                searchable="false"
                onChange={value => this.setState({ lowStockPercent: value.value })}
              />
            </div>
          </div>
          <div style={{ gridColumn: '2 / 4', gridRow: '3 / 4', paddingTop: '2%', paddingLeft: '3%' }}>
            <ReactTable
              columns={columns}
              data={this.state.tableData}
              defaultPageSize={5}
              className="-striped -highlight"
              style={{ color: 'black' }}
            />
          </div>
          <div style={{ gridColumn: '4 / 5', gridRow: '2 / 4' }}>
            <ManagerHomeBar />
          </div>
        </div>
      </div>
    );
  }
}

export default ManagerHome;
