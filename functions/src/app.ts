import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as cors from 'cors'
import * as url from 'url'
import * as mime from 'mime'

import { dataFromPathWithFallback, VerifyPasswordResult, verifyPassword, savePassword } from './utils'

const storage = admin.storage().bucket()
const app = express()

export default functions.https.onRequest(app)

app.use(cors())

app.get('*', async (req, res) => {
	try {
		const { pathname } = url.parse(req.url, false)
		
		if (!pathname) {
			res.status(404).send('Looks like you have the wrong URL.')
			return
		}
		
		const { contentType, data } = await dataFromPathWithFallback(pathname)
		
		res.set('Content-Type', contentType ?? undefined).send(data)
	} catch (error) {
		console.error(error)
		res.status(404).send('Looks like you have the wrong URL.')
	}
})

app.post('/upload', async ({ body: { id: projectId, password, files } }, res) => {
	try {
		if (!(
			typeof projectId === 'string' &&
			typeof password === 'string' &&
			typeof files === 'object'
		)) {
			res.status(400).send()
			return
		}
		
		const promises: Promise<any>[] = []
		
		switch (await verifyPassword(projectId, password)) {
			case VerifyPasswordResult.Invalid:
				res.status(403).send('Invalid password')
				return
			case VerifyPasswordResult.New:
				promises.push(savePassword(projectId, password))
				break
		}
		
		for (const [path, data] of Object.entries(files))
			promises.push(
				storage
					.file(`projects/${projectId}${path}`)
					.save(Buffer.from(data as number[]), {
						contentType: mime.getType(path) ?? undefined
					})
			)
		
		await Promise.all(promises)
		
		res.send(`https://smplhst.web.app/${projectId}`)
	} catch (error) {
		console.error(error)
		res.status(500).send(error)
	}
})
