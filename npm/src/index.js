#!/usr/bin/env node

const glob = require('glob')
const { join } = require('path')
const { readFile } = require('fs')
const axios = require('axios').default

const [projectId, password] = require('yargs')
	.scriptName('simplehost')
	.help()
	.argv
	._

const cwd = process.cwd()

const stripCWD = path =>
	path.slice(cwd.length)

const arrayFromBuffer = buffer => {
	const { length } = buffer
	const acc = new Array(length)
	
	for (let i = 0; i < length; i++)
		acc[i] = buffer[i]
	
	return acc
}

glob(join(cwd, '**/*'), async (error, paths) => {
	if (error)
		return console.error(error)
	
	try {
		let i = 0
		
		const pairs = await Promise.all(paths.map(async path => {
			try {
				const data = await new Promise((resolve, reject) =>
					readFile(path, (error, data) =>
						error
							? reject(error)
							: resolve(data)
					)
				)
				
				console.log(`Read file #${++i}`)
				
				return {
					path: stripCWD(path),
					data: arrayFromBuffer(data)
				}
			} catch {
				return null
			}
		}))
		
		process.stdout.write('\nUploading...')
		
		const response = await axios.post('https://smplhst.web.app/upload', {
			id: projectId,
			password,
			files: pairs.reduce((acc, pair) => (
				pair
					? { ...acc, [pair.path]: pair.data }
					: acc
			), {})
		})
		
		console.log(` DONE\n\n${response.data}\n`)
	} catch (error) {
		console.error(error)
	}
})
