const _ = require('lodash')
const path = require('path')
const axios = require('axios');

// this are position ids of issues in gitlab they might be different depending on your swimlane setup
// position_id:message

const tags = {
  'Test on Dev': 'please test on dev - [this is a bot generated message]',
  'Test on Staging': 'please test on staging - [this is a bot generated message]',
  'Test on Prod': 'please test on prod - [this is a bot generated message]',
}

const instance = axios.create({
  baseURL: 'https://gitlab.com/api/v4',
  timeout: 10000,
  headers: {'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN,}
});

module.exports = async (body) => {
  try {
    const tag = getTestTag(body.changes.labels)
    const issuePath = `/projects/${body.project.id}/issues/${body.object_attributes.iid}`
    const discussionPath = `${issuePath}/discussions`

    await instance.post(discussionPath, null, {
      params: {
        body: `@${process.env.PM_GITLAB_TAG} ${tags[tag]}`
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
  return getTestTag(body.changes.labels || {});
}

const getPositions = (body) => _.get(body, "changes.relative_position", {});

const getTestTag = (labels = {}) => {
  const { previous = [], current = [] } = labels;
  const expectedTags = Object.keys(tags)
  const currentTags = current.map((c) => c.title)
  const activeTag = currentTags.filter((t) => expectedTags.includes(t))[0]
  if (activeTag && !previous.find((p) => p.title === activeTag)) {
    return activeTag;
  } else {
    return null;
  }
}