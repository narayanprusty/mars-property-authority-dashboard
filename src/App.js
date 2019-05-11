import React, { Component } from 'react';

import './App.css';
import 'sweetalert/dist/sweetalert.css'
import "tabler-react/dist/Tabler.css";
import { 
  Grid, 
  Header, 
  Tab, 
  TabbedCard, 
  Form, 
  Button,
  Text,
  Card,
  Alert,
  StatsCard
} from "tabler-react";
import LaddaButton, { EXPAND_LEFT } from 'react-ladda';
import SweetAlert from 'sweetalert-react';

class App extends Component {

  constructor(props){
    super(props);
    this.state = {};

    (async () => {
      let result = await (await fetch('http://ec2-52-90-174-194.compute-1.amazonaws.com:3001/getPREKey', {
        method: 'get'
      })).json()

      this.setState({
        publicKey: result.message
      })
    })()
  }

  getUserInfo = async (e) => {
    e.preventDefault()

    if(!this.state.userId) {
      this.setState({
        getUserInfoError: 'Details missing',
      })

      return;
    }

    this.setState({
      getUserInfoLoading: true
    })

    let result = await (await fetch(`http://ec2-52-90-174-194.compute-1.amazonaws.com:3001/signAccess?id=${this.state.userId}`, {
      method: 'get'
    })).json()

    if(!result.error) {
      let signature = result.message

      result = await (await fetch('http://ec2-52-90-174-194.compute-1.amazonaws.com:3000/getUserMetadata', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.state.userId,
          publicKey: this.state.publicKey,
          signature
        })
      })).json()

      if(!result.error) {
        let preKey = result.message.preKey.preKey
        let capsule = result.message.user.capsule
        let metadataEncrypted = result.message.user.metadataEncrypted

        result = await (await fetch('http://ec2-52-90-174-194.compute-1.amazonaws.com:3001/decryptMetadata', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            preKey, capsule, metadataEncrypted,
            id: this.state.userId
          })
        })).json()

        if(!result.error) {
          this.setState({
            getUserInfoError: '',
            getUserInfoSuccess: true,
            userData: `Name: ${result.message.name}, Age: ${result.message.age} and Birth Place: ${result.message.birthPlace}`
          })
        } else {
          this.setState({
            getUserInfoError: 'An error occured'
          })
        }
      } else {
        this.setState({
          getUserInfoError: 'An error occured'
        })
      }
    } else {
      this.setState({
        getUserInfoError: 'An error occured'
      })
    }

    this.setState({
      getUserInfoLoading: false
    })
  }

  addProperty = async (e) => {
    e.preventDefault()

    if(!this.state.ownerId || !this.state.location) {
      this.setState({
        transferError: 'Details missing',
      })

      return;
    }

    this.setState({
      addPropertyLoading: true
    })

    let result = await (await fetch('http://ec2-52-90-174-194.compute-1.amazonaws.com:3001/addProperty', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "location": this.state.location,
        "owner": this.state.ownerId
      })
    })).json()

    if(!result.error) {
      this.setState({
        addPropertyError: '',
        propertyId: result.message
      })
    } else {
      this.setState({
        addPropertyError: 'An error occured'
      })
    }

    this.setState({
      addPropertyLoading: false
    })
  }

  getPropertyInfo = async (e) => {
    e.preventDefault()

    if(!this.state.propertyUniqueID) {
      this.setState({
        getPropertyrInfoError: 'Details missing',
      })

      return;
    }

    this.setState({
      getPropertyInfoLoading: true
    })

    let result = await (await fetch(`http://ec2-52-90-174-194.compute-1.amazonaws.com:3001/getProperty?propertyId=${this.state.propertyUniqueID}`, {
      method: 'get',
    })).json()

    if(!result.error) {
      this.setState({
        getPropertyInfoError: '',
        propertyDetails: `Location: ${result.message.location}, Owner: ${result.message.owner} and Previous Owners: ${result.message.history.toString()}`
      })
    } else {
      this.setState({
        getPropertyInfoError: 'An error occured'
      })
    }

    this.setState({
      getPropertyInfoLoading: false
    })
  }

  handleChanges = e => {
    this.setState({
        [e.target.name]: e.target.value,
    });
  };

  render() {
    return (
      <Grid.Row>
        <Grid.Col className="mb-4" offset={3} width={6}>
          <Header.H1 className="mt-4">Property Authority Dashboard</Header.H1>
          <TabbedCard initialTab="Info">
            <Tab title="Info">
              <Card
                title="Public Key"
                body={`Any martian can grant their personal information access to property authority using this public key: ${this.state.publicKey}`}
              />
            </Tab>
            <Tab title="Add Property">
              <Form onSubmit={this.addProperty} className="mb-4">
                <Form.Input name='location' label='Location' placeholder='Enter Location' onChange={this.handleChanges} />
                <Form.Input name='ownerId' label='Owner ID' placeholder='Enter Owner ID' onChange={this.handleChanges} />
                {this.state.authorizeError &&
                  <Alert type="danger">
                    {this.state.addPropertyError}
                  </Alert>
                }
                <LaddaButton
                  loading={this.state.addPropertyLoading}
                  type="submit"
                  data-style={EXPAND_LEFT}
                  className="btn btn-primary"
                >
                  Add Property
                </LaddaButton>
                <SweetAlert
                  show={this.state.propertyId ? true : false}
                  title="Success"
                  text={"Property created with id " + this.state.propertyId}
                  onConfirm={() => this.setState({ propertyId: '' })}
                />
              </Form>
            </Tab>
            <Tab title="Get User Info">
              <Form onSubmit={this.getUserInfo} className="mb-4">
                <Form.Input name='userId' label='User ID' placeholder='Enter User ID' onChange={this.handleChanges} />
                {this.state.getUserInfoError &&
                  <Alert type="danger">
                    {this.state.getUserInfoError}
                  </Alert>
                }
                <LaddaButton
                  loading={this.state.getUserInfoLoading}
                  type="submit"
                  data-style={EXPAND_LEFT}
                  className="btn btn-primary"
                >
                  Get User Info
                </LaddaButton>
                <SweetAlert
                  show={this.state.getUserInfoSuccess}
                  title="Success"
                  text={this.state.userData}
                  onConfirm={() => this.setState({ getUserInfoSuccess: false })}
                />
              </Form>
            </Tab>
            <Tab title="Get Property Info">
              <Form onSubmit={this.getPropertyInfo} className="mb-4">
                <Form.Input name='propertyUniqueID' label='Property ID' placeholder='Enter Property ID' onChange={this.handleChanges} />
                {this.state.gePropertyInfoError &&
                  <Alert type="danger">
                    {this.state.gePropertyInfoError}
                  </Alert>
                }
                <LaddaButton
                  loading={this.state.getPropertyInfoLoading}
                  type="submit"
                  data-style={EXPAND_LEFT}
                  className="btn btn-primary"
                >
                  Get Property Info
                </LaddaButton>
                <SweetAlert
                  show={this.state.propertyDetails}
                  title="Success"
                  text={this.state.propertyDetails}
                  onConfirm={() => this.setState({ propertyDetails: false })}
                />
              </Form>
            </Tab>
          </TabbedCard>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

export default App;