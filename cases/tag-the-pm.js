const _ = require('lodash')
const path = require('path')
const axios = require('axios');

// this are position ids of issues in gitlab they might be different depending on your swimlane setup
// position_id:message
const stages = {
  123290: "please test on dev - [this is a bot generated message]",
  123157: "please test on staging - [this is a bot generated message]",
  1763: "please test on prod - [this is a bot generated message]"
}

const instance = axios.create({
  baseURL: 'https://gitlab.com/api/v4',
  timeout: 10000,
  headers: {'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN,}
});

module.exports = async (body) => {
  try {
    const { current } = getPositions(body)
    const issuePath = `/projects/${body.project.id}/issues/${body.object_attributes.iid}`
    const discussionPath = `${issuePath}/discussions`

    await instance.post(discussionPath, null, {
      params: {
        body: `@${process.env.PM_GITLAB_TAG} ${stages[current]}`
      }
    })
    await instance.put(issuePath, {
      assignee_ids: [
        ...body.object_attributes.assignee_ids,
        process.env.PM_GITLAB_ID
      ]
    })
 
  } catch (error) {
    console.error(error)
  }
}

// should return bool if this should be processed by the main fn 
module.exports.valid = (body) => {
  const { previous, current } = getPositions(body)
  return previous && current && previous !== current && stages[current];
}

const getPositions = (body) => _.get(body, "changes.relative_position", {});
