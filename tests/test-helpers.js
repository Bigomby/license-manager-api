'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

class MockMailer {
  static send(options, context, cb) {
    cb(null, null);
  }
}

class UserHelper {
  constructor(serverUrl, user) {
    this.req = chai.request(serverUrl);
    this.user = user;
  }

  async createUser(user) {
    const res = await this.req
      .request(this.serverUrl)
      .post('users')
      .send(user);

    this.user = res.body;
    return this.user;
  }

  async getAdmins(user) {
    const res = await this.req
      .get(`groups/${this.group.id}/admins`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async createGroup(name) {
    const res = await this.req
      .post('groups')
      .set('Authorization', this.user.authToken.id)
      .send({
        name: 'test',
      });

    this.group = res.body;
    return res.body;
  }

  async setGroup(group) {
    this.group = group;
  }

  async getGroups() {
    const res = await this.req
      .get('groups')
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async getMembers() {
    const res = await this.req
      .get(`groups/${this.group.id}/members`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async addMember(member) {
    const res = await this.req
      .put(`groups/${this.group.id}/members/rel/${member.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }

  async addAdmin(admin) {
    const res = await this.req
      .put(`groups/${this.group.id}/admins/rel/${admin.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }

  async removeMember(member) {
    const res = await this.req
      .delete(`groups/${this.group.id}/members/rel/${member.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }

  async removeAdmin(admin) {
    const res = await this.req
      .delete(`groups/${this.group.id}/admins/rel/${admin.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }

  async getClusters() {
    const res = await this.req
      .get(`groups/${this.group.id}/clusters`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async createCluster(uuid, globalLicensing = true) {
    const res = await this.req
      .post(`groups/${this.group.id}/clusters`)
      .set('Authorization', this.user.authToken.id)
      .send({uuid, globalLicensing});

    return res.body;
  }

  async removeCluster(cluster) {
    const res = await this.req
      .delete(`groups/${this.group.id}/clusters/${cluster.id}`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async createOrganization(uuid, cluster) {
    const res = await this.req
      .post(`groups/${this.group.id}/organizations`)
      .set('Authorization', this.user.authToken.id)
      .send({uuid, clusterId: cluster.id});

    return res.body;
  }

  async getOrganizations(uuid) {
    const res = await this.req
      .get(`groups/${this.group.id}/organizations`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async removeOrganization(org) {
    const res = await this.req
      .delete(`groups/${this.group.id}/organizations/${org.id}`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }
}

module.exports = {
  UserHelper,
  MockMailer,
};
