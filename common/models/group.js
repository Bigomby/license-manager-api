'use strict';

const _ = require('lodash');
const sensorCollection = require('../sensorData');

function getApp(model) {
  return new Promise((resolve, reject) => {
    model.getApp((err, app) => {
      if (err) return reject(err);
      resolve(app);
    });
  });
}

module.exports = async function(Group) {
  const app = await getApp(Group);
  const user = app.models.user;
  const Cluster = app.models.cluster;
  const Organization = app.models.organization;

  Group.validatesUniquenessOf('name', {message: 'name is not unique'});
  Group.validatesInclusionOf('type', {in: ['redborder', 'teldat']});

  Group.disableRemoteMethodByName('exists');
  Group.disableRemoteMethodByName('upsert');
  Group.disableRemoteMethodByName('upsertWithWhere');
  Group.disableRemoteMethodByName('replaceOrCreate');
  Group.disableRemoteMethodByName('replaceById');
  Group.disableRemoteMethodByName('updateAll');
  Group.disableRemoteMethodByName('prototype.updateAttributes');

  Group.disableRemoteMethodByName('findOne');

  Group.disableRemoteMethodByName('deleteById');

  Group.disableRemoteMethodByName('createChangeStream');
  Group.disableRemoteMethodByName('count');

  Group.disableRemoteMethodByName('prototype.__create__members');
  Group.disableRemoteMethodByName('prototype.__delete__members');

  Group.beforeRemote('create', async context => {
    if (!context.args.data.name) return;

    const usr = await user.findById(context.req.accessToken.userId);
    if (!usr) throw Error('Invalid access token');

    context.owner = usr;
    context.args.data.name = `${usr.username}/${context.args.data.name}`;
  });

  Group.afterRemote('create', async (context, instance) => {
    await instance.owner(context.owner);
    await instance.members.add(context.owner);
    await instance.admins.add(context.owner);
    await instance.save();
  });

  Group.afterRemote('find', async (context, instances) => {
    const userToken = context.req.accessToken.userId.toString();

    const allowedGroup = (await Promise.all(
      instances.map(async instance => await instance.members.find({}))
    )).map(group => group.some(member => member.id.toString() === userToken));

    const filteredInstances = _.flatten(
      _.zip(instances, allowedGroup).filter(pair => !pair.pop())
    );

    _.pullAll(instances, filteredInstances);
  });

  Group.afterRemote('prototype.__link__admins', async (context, instance) => {
    const group = await Group.findById(instance.groupId);
    await group.members.add(instance.adminId);
  });

  Group.beforeRemote('prototype.__create__organizations', async context => {
    const cluster = await Cluster.findById(context.args.data.clusterId);
    if (!cluster) throw 'Invalid cluster id';

    if (cluster.globalLicensing) {
      throw 'Is not possible to add organizations to a cluster with ' +
        'Global Licensing enabled';
    }
  });

  Group.beforeRemote('prototype.__create__license-pools', async context => {
    const organizationId = context.args.data.organizationId;
    const clusterId = context.args.data.clusterId;
    if (!clusterId) throw 'clusterId is required';

    context.args.data.status = 'pending';

    const cluster = await Cluster.findById(clusterId);
    if (!cluster) throw 'Invalid cluster';

    if (!cluster.globalLicensing) {
      const organization = await Organization.exists(organizationId);
      if (!organization) throw 'Invalid organization';
    }

    const collectionSensors = sensorCollection[context.instance.type];
    const requestSensors = Object.keys(context.args.data.sensors);
    if (!requestSensors.length) throw 'No sensors in the license pool';

    const isValidSensorRequest = requestSensors
      .map(e => collectionSensors.includes(e))
      .reduce((previous, current) => previous && current);
    if (!isValidSensorRequest) throw 'Invalid sensors requested';
  });
};
