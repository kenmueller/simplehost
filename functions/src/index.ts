import * as admin from 'firebase-admin'

admin.initializeApp({
	storageBucket: 'smplhst.appspot.com'
})

export { default as app } from './app'
