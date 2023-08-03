require('dotenv').config()
const dayjs = require('dayjs')
const { Octokit } = require('@octokit/rest')
const Axios = require('axios')

const { WAKATIME_API_KEY, GH_TOKEN, GIST_ID } = process.env
const BASE_URL = 'https://wakatime.com/api/v1'
const summariesApi = `${BASE_URL}/users/current/summaries`

const octokit = new Octokit({
  auth: `token ${GH_TOKEN}`
})

function getMySummary(date) {
  return Axios.get(summariesApi, {
    params: {
      start: date,
      end: date,
      api_key: WAKATIME_API_KEY
    }
  }).then(response => response.data)
}

/**
 * update wakatime content to gist
 * @param {*} date - update date
 * @param {*} content update content
 */
async function updateGist(date, content) {
  const file = ''
  try {
    await octokit.gists.update({
      gist_id: GIST_ID,
      files: {
        [`summaries_${date}.json`]: {
          content: JSON.stringify(content)
        }
      }
    })
  } catch (error) {
    console.error(`Unable to update gist \n ${error}`)
  }
}

const fetchSummaryWithRetry = async times => {
  const yesterday = dayjs()
    .subtract(1, 'day')
    .format('YYYY-MM-DD')
  try {
    const mySummary = await getMySummary(yesterday)
    await updateGist(yesterday, mySummary.data)
  } catch (error) {
    if (times === 1) {
      console.error(`Unable to fetch wakatime summary\n ${error} `)
      return
    }
    console.log(`retry fetch summary data: ${times - 1} time`)
    fetchSummaryWithRetry(times - 1)
  }
}

async function main() {
  fetchSummaryWithRetry(3)
}

main()
