import { exec } from 'child_process'
// afterPackHook: win-unpacked文件夹生成后执行

/**
 * 数据库迁移
 * @param {string} outDir
 * @returns
 */
async function dbMigrate(outDir) {
  // 执行数据库迁移
  const CMD = `cd ${outDir}/resources && npx prisma migrate deploy`
  return new Promise((resolve, reject) => {
    exec(CMD, (error, _stdout, _stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        reject(error)
        return
      }
      resolve()
    })
  })
}

async function deleteNeedlessFile(outDir) {
  // 删除schema.prisma文件和migrations文件夹
  // windows下的命令
  const CMD = `cd ${outDir}/resources/prisma/ && del schema.prisma && rmdir /s /q migrations`
  return new Promise((resolve, reject) => {
    exec(CMD, (error, _stdout, _stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        reject(error)
        return
      }
      resolve()
    })
  })
}

export default async function (context) {
  const outDir = context.appOutDir
  // await dbMigrate(outDir)
  // return await deleteNeedlessFile(outDir)
  return await dbMigrate(outDir)
}
