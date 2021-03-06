'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const ClusterHelper = require('./cluster-helper');

chai.use(chaiHttp);

/**
 * GroupHelper is a wraper of a HTTP REST client used for tests.
 *
 * Every instance of a GroupHelper is associated to a user so the requests
 * done by an instance will use the associated user access token.
 */
class GroupHelper {
  /**
   * Creates a new instance of GroupHelper associated to a group.
   *
   * @param  {Object} userHelper User to use on this instance
   * @param  {Object} group      Group to use on this instance
   */
  constructor(userHelper, group) {
    this.user = userHelper.getInstance();
    this.group = group;
    this.url = userHelper.url;
    this.req = chai.request(this.url);
  }

  /**
   * Return the internal instance.
   *
   * @return {Object} Internal group instance
   */
  getInstance() {
    return this.group;
  }

  /**
   * List all the members of the group.
   *
   * @return {Promise} Array with the members
   */
  async getMembers() {
    const res = await this.req
      .get(`groups/${this.group.id}/members`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  /**
   * List all the admins of the group.
   *
   * @return {Promise} Array with the admins
   */
  async getAdmins() {
    const res = await this.req
      .get(`groups/${this.group.id}/admins`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  /**
   * Adds a new member to the group.
   *
   * @param  {Object}  member User to add as member
   */
  async addMember(memberHelper) {
    await this.req
      .put(`groups/${this.group.id}/members/rel/${memberHelper.user.id}`)
      .set('Authorization', this.user.authToken.id);
  }

  /**
   * Adds a new admin to the group. Note that adding an admin also includes
   * adding that user as member.
   *
   * @param  {Object}  admin User to add as admin
   */
  async addAdmin(admin) {
    await this.req
      .put(`groups/${this.group.id}/admins/rel/${admin.getInstance().id}`)
      .set('Authorization', this.user.authToken.id);
  }

  /**
   * Removes a member from the group.
   *
   * @param  {Object}  member Member to remove
   */
  async removeMember(member) {
    await this.req
      .delete(`groups/${this.group.id}/members/rel/${member.getInstance().id}`)
      .set('Authorization', this.user.authToken.id);
  }

  /**
   * Removes an admin from the group. Note that this method does NOT remove the
   * user as member.
   *
   * @param  {Object}  admin Admin to remove
   */
  async removeAdmin(admin) {
    await this.req
      .delete(`groups/${this.group.id}/admins/rel/${admin.getInstance().id}`)
      .set('Authorization', this.user.authToken.id);
  }

  /**
   * List clusters that belongs to a group.
   *
   * @return {Promise} Array of clusters
   */
  async getClusters() {
    const res = await this.req
      .get(`groups/${this.group.id}/clusters`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  /**
   * Creates a new cluster in a group.
   *
   * @param  {String}  uuid                   UUID of the cluster to create
   * @param  {Boolean} [globalLicensing=true] Indicates if the cluster uses a
   *                                          global licensing mode
   * @return {Promise}                        ClusterHelper for the cluster
   *                                          created
   */
  async createCluster(uuid, globalLicensing = true) {
    const res = await this.req
      .post(`groups/${this.group.id}/clusters`)
      .set('Authorization', this.user.authToken.id)
      .send({uuid, globalLicensing});

    return new ClusterHelper(this, res.body);
  }

  /**
   * Set the internal cluster of the group to a given cluster. Useful when
   * there is a cluster created by another user. Note this functions does not
   * imply a request to the server.
   *
   * @param  {Object} clusterHelper Existent cluster
   * @return {Object}               ClusterHelper associated to this group
   */
  attachCluster(clusterHelper) {
    return new ClusterHelper(this, clusterHelper.cluster);
  }

  /**
   * Removes a cluster from the group.
   *
   * @param  {Object}  cluster Cluster to remove from the group
   */
  async removeCluster(cluster) {
    await this.req
      .delete(`groups/${this.group.id}/clusters/${cluster.getInstance().id}`)
      .set('Authorization', this.user.authToken.id);
  }
}

module.exports = GroupHelper;
