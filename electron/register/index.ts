import store from '../store'
import { version } from '../../package.json'
const VERSION = 'version'

export default async function () {
  if (version !== store.get(VERSION)) {
    store.set(VERSION, version)
  }
}
