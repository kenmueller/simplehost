import * as admin from 'firebase-admin'
import * as bcrypt from 'bcrypt'
import * as mime from 'mime'
import { join } from 'path'

const firestore = admin.firestore()
const storage = admin.storage().bucket()

export enum VerifyPasswordResult {
	Valid,
	Invalid,
	New
}

export const verifyPassword = async (projectId: string, password: string) => {
	const snapshot = await firestore.doc(`projects/${projectId}`).get()
	
	return snapshot.exists
		? (await bcrypt.compare(password, snapshot.get('password')))
			? VerifyPasswordResult.Valid
			: VerifyPasswordResult.Invalid
		: VerifyPasswordResult.New
}

export const savePassword = async (projectId: string, password: string) =>
	firestore.doc(`projects/${projectId}`).create({
		password: await bcrypt.hash(password, 10)
	})

export const dataFromPath = async (path: string) => {
	const [data] = await storage.file(`projects${path}`).download()
	
	return {
		contentType: mime.getType(path),
		data: data.length ? data : undefined
	}
}

export const dataFromPathWithFallback = async (path: string) =>
	dataFromPath(path)
		.catch(() => dataFromPath(join(path, 'index.html')))
		.catch(() => dataFromPath(join(path, 'index.htm')))
