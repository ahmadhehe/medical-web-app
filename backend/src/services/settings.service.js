const prisma = require('../lib/prisma');
const { createAuditLog } = require('./audit.service');

const getAllSettings = async () => {
  return prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
};

const getSetting = async (key) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) {
    const error = new Error(`Setting "${key}" not found`);
    error.status = 404;
    throw error;
  }
  return setting;
};

const upsertSetting = async (key, value, actorId, ipAddress) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await createAuditLog({
    actorId, actionType: 'UPDATE', targetType: 'system_setting',
    targetId: setting.id, description: `Setting "${key}" updated`, ipAddress,
  });
  return setting;
};

const upsertMany = async (settings, actorId, ipAddress) => {
  const results = [];
  for (const { key, value } of settings) {
    results.push(await upsertSetting(key, value, actorId, ipAddress));
  }
  return results;
};

const deleteSetting = async (key, actorId, ipAddress) => {
  const setting = await getSetting(key);
  await prisma.systemSetting.delete({ where: { key } });
  await createAuditLog({
    actorId, actionType: 'DELETE', targetType: 'system_setting',
    targetId: setting.id, description: `Setting "${key}" deleted`, ipAddress,
  });
};

module.exports = { getAllSettings, getSetting, upsertSetting, upsertMany, deleteSetting };
