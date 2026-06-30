const STORAGE_KEY = 'knee-check-in-records-v1'

const options = {
  kneeSides: ['左膝', '右膝', '双膝', '说不清'],
  overallScores: ['0 完全没感觉', '1 有存在感，但不痛', '2 酸胀或紧绷', '3 轻微疼痛', '4 明显疼痛，但还能正常走路', '5 影响走路或日常活动'],
  durations: ['几分钟', '不到1小时', '1-3小时', '半天左右', '一整天都明显', '说不清'],
  locations: ['膝盖前方', '髌骨周围', '膝盖内侧', '膝盖外侧', '膝盖后方', '整个膝盖', '说不清'],
  timings: ['久坐后起身', '上楼', '下楼', '蹲下或站起', '走久了', '跳操后', '早晨起床', '晚上', '今天没有明显时刻', '说不清'],
  triggers: ['久坐超过4小时', '连续坐着超过1小时没有起身', '上下楼较多', '走路较多', '站立较久', '跳操', '深蹲', '弓步', '开合跳或其他跳跃动作', '快速扭转膝盖', '穿了不太舒服的鞋', '地面较硬', '都没有', '说不清'],
  exerciseIntensities: ['没跳操', '很轻松', '有点累', '比较累', '很累', '说不清'],
  exerciseDurations: ['没跳操', '10分钟以内', '10-20分钟', '20-40分钟', '40分钟以上', '说不清'],
  activityChanges: ['变好了', '没变化', '更明显了', '不确定', '今天没有观察到'],
  restChanges: ['变好了', '没变化', '更明显了', '不确定', '今天没有观察到'],
  reliefMethods: ['没有特别处理', '休息', '减少上下楼', '停止跳操', '热敷', '冰敷', '拉伸', '轻微走动', '其他'],
  reliefEffects: ['没尝试', '有明显缓解', '有一点缓解', '没什么变化', '更不舒服', '说不清'],
  redFlags: ['明显肿胀', '发热发红', '不能正常承重', '膝盖卡住，伸不直或弯不下去', '膝盖打软或突然没力', '受伤时听到或感觉到“啪”的一下', '明显咔哒声并伴随不适', '发烧，同时膝盖红肿痛', '都没有']
}

function defaultDraft() {
  return {
    dateTime: formatInputDate(new Date()),
    kneeSide: '说不清',
    overallScore: 1,
    duration: '说不清',
    locations: [],
    timing: [],
    triggers: [],
    exerciseIntensity: '没跳操',
    exerciseDuration: '没跳操',
    activityChange: '今天没有观察到',
    restChange: '今天没有观察到',
    reliefMethods: [],
    reliefEffect: '没尝试',
    redFlags: ['都没有'],
    note: ''
  }
}

Page({
  data: {
    tabs: ['今日打卡', '历史记录', '趋势概览', '设置/说明'],
    activeTab: 0,
    options,
    step: 0,
    totalSteps: 15,
    editingId: '',
    draft: defaultDraft(),
    records: [],
    filter: '全部',
    filters: ['全部', '左膝', '右膝', '双膝', '有危险信号', '评分>=3'],
    stats: buildStats([]),
    importText: ''
  },

  onLoad() {
    this.refreshRecords()
  },

  switchTab(event) {
    this.setData({ activeTab: Number(event.currentTarget.dataset.index) })
    if (Number(event.currentTarget.dataset.index) === 2) {
      this.setData({ stats: buildStats(this.data.records) })
    }
  },

  setFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.value })
  },

  setField(event) {
    const key = event.currentTarget.dataset.key
    this.setData({ [`draft.${key}`]: event.detail.value })
  },

  setChoice(event) {
    const key = event.currentTarget.dataset.key
    const value = event.currentTarget.dataset.value
    if (key === 'overallScore') {
      this.setData({ 'draft.overallScore': Number(value.slice(0, 1)) })
      return
    }
    this.setData({ [`draft.${key}`]: value })
  },

  toggleChoice(event) {
    const key = event.currentTarget.dataset.key
    const value = event.currentTarget.dataset.value
    const exclusive = ['都没有', '说不清', '今天没有明显时刻', '没有特别处理']
    const current = this.data.draft[key] || []
    let next = current.includes(value) ? current.filter((item) => item !== value) : current.concat(value)
    if (exclusive.includes(value) && next.includes(value)) next = [value]
    if (!exclusive.includes(value)) next = next.filter((item) => !exclusive.includes(item))
    this.setData({ [`draft.${key}`]: next })
  },

  setNote(event) {
    this.setData({ 'draft.note': event.detail.value })
  },

  prevStep() {
    this.setData({ step: Math.max(0, this.data.step - 1) })
  },

  nextStep() {
    this.setData({ step: Math.min(this.data.totalSteps - 1, this.data.step + 1) })
  },

  submitRecord() {
    const now = new Date().toISOString()
    const existing = this.data.records.find((record) => record.id === this.data.editingId)
    const record = {
      ...this.data.draft,
      id: this.data.editingId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      redFlags: this.data.draft.redFlags.length ? this.data.draft.redFlags : ['都没有']
    }
    const records = this.data.editingId
      ? this.data.records.map((item) => item.id === this.data.editingId ? record : item)
      : [record].concat(this.data.records)
    saveRecords(records)
    this.setData({
      records: sortRecords(records),
      draft: defaultDraft(),
      step: 0,
      editingId: '',
      activeTab: 1
    })
    wx.showToast({ title: '已记录', icon: 'success' })
    if (hasRedFlags(record)) {
      wx.showModal({
        title: '需要留意',
        content: '今天记录到可能需要医疗评估的情况。这个小程序不能判断病因。如果出现明显肿胀、发热发红、不能承重、膝盖卡住、打软腿或突然严重疼痛，建议尽快联系医生、骨科、运动医学科或康复科。',
        showCancel: false
      })
    }
  },

  editRecord(event) {
    const id = event.currentTarget.dataset.id
    const record = this.data.records.find((item) => item.id === id)
    if (!record) return
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = record
    this.setData({ draft, editingId: id, step: 0, activeTab: 0 })
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条记录吗？',
      success: (res) => {
        if (!res.confirm) return
        const records = this.data.records.filter((record) => record.id !== id)
        saveRecords(records)
        this.setData({ records, stats: buildStats(records) })
      }
    })
  },

  cancelEdit() {
    this.setData({ draft: defaultDraft(), editingId: '', step: 0 })
  },

  copyJson() {
    wx.setClipboardData({
      data: JSON.stringify(this.data.records, null, 2),
      success: () => wx.showToast({ title: 'JSON已复制' })
    })
  },

  copyCsv() {
    wx.setClipboardData({
      data: toCsv(this.data.records),
      success: () => wx.showToast({ title: 'CSV已复制' })
    })
  },

  setImportText(event) {
    this.setData({ importText: event.detail.value })
  },

  importJson() {
    try {
      const parsed = JSON.parse(this.data.importText)
      if (!Array.isArray(parsed)) throw new Error('JSON 顶层需要是数组')
      const records = sortRecords(parsed.map(normalizeRecord).filter(Boolean))
      saveRecords(records)
      this.setData({ records, importText: '', stats: buildStats(records) })
      wx.showToast({ title: '导入成功' })
    } catch (error) {
      wx.showModal({ title: '导入失败', content: '请确认粘贴的是之前导出的 JSON。', showCancel: false })
    }
  },

  clearAll() {
    wx.showModal({
      title: '清空全部数据',
      content: '确定清空全部记录吗？此操作不能撤销。',
      success: (first) => {
        if (!first.confirm) return
        wx.showModal({
          title: '再次确认',
          content: '真的要清空所有 Knee Check-in 记录吗？',
          success: (second) => {
            if (!second.confirm) return
            saveRecords([])
            this.setData({ records: [], stats: buildStats([]) })
          }
        })
      }
    })
  },

  refreshRecords() {
    const records = sortRecords(wx.getStorageSync(STORAGE_KEY) || [])
    this.setData({ records, stats: buildStats(records) })
  }
})

function saveRecords(records) {
  wx.setStorageSync(STORAGE_KEY, sortRecords(records))
}

function hasRedFlags(record) {
  return (record.redFlags || []).some((flag) => flag !== '都没有')
}

function sortRecords(records) {
  return records.slice().sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return null
  const draft = defaultDraft()
  return {
    ...draft,
    ...record,
    id: String(record.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    overallScore: Number(record.overallScore || 0),
    locations: Array.isArray(record.locations) ? record.locations : [],
    timing: Array.isArray(record.timing) ? record.timing : [],
    triggers: Array.isArray(record.triggers) ? record.triggers : [],
    reliefMethods: Array.isArray(record.reliefMethods) ? record.reliefMethods : [],
    redFlags: Array.isArray(record.redFlags) && record.redFlags.length ? record.redFlags : ['都没有']
  }
}

function buildStats(records) {
  const now = new Date()
  const daysAgo = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  const last7 = records.filter((record) => new Date(record.dateTime) >= daysAgo(7))
  const last14 = records.filter((record) => new Date(record.dateTime) >= daysAgo(14))
  const previous7 = records.filter((record) => {
    const date = new Date(record.dateTime)
    return date >= daysAgo(14) && date < daysAgo(7)
  })
  const recent = sortRecords(records).slice(0, 3)
  return {
    avg7: average(last7),
    avg14: average(last14),
    max7: last7.length ? Math.max(...last7.map((record) => record.overallScore)) : 0,
    streak: recordStreak(records),
    topTriggers: topItems(records.flatMap((record) => record.triggers || []).filter((item) => !['都没有', '说不清'].includes(item))).slice(0, 5),
    topLocations: topItems(records.flatMap((record) => record.locations || []).filter((item) => item !== '说不清')).slice(0, 5),
    rising: previous7.length > 0 && Number(average(last7)) > Number(average(previous7)),
    threeHigh: recent.length === 3 && recent.every((record) => record.overallScore >= 3),
    hasAnyRedFlags: records.some(hasRedFlags)
  }
}

function average(records) {
  if (!records.length) return '0.0'
  return (records.reduce((sum, record) => sum + Number(record.overallScore || 0), 0) / records.length).toFixed(1)
}

function topItems(items) {
  const counts = {}
  items.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1
  })
  return Object.keys(counts).map((name) => ({ name, count: counts[name] })).sort((a, b) => b.count - a.count)
}

function recordStreak(records) {
  const days = new Set(records.map((record) => new Date(record.dateTime).toISOString().slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function toCsv(records) {
  const headers = ['id', 'createdAt', 'updatedAt', 'dateTime', 'kneeSide', 'overallScore', 'duration', 'locations', 'timing', 'triggers', 'exerciseIntensity', 'exerciseDuration', 'activityChange', 'restChange', 'reliefMethods', 'reliefEffect', 'redFlags', 'note']
  const rows = records.map((record) => headers.map((key) => csvCell(Array.isArray(record[key]) ? record[key].join('; ') : String(record[key] || ''))).join(','))
  return [headers.join(','), ...rows].join('\n')
}

function csvCell(value) {
  return `"${value.replace(/"/g, '""')}"`
}

function formatInputDate(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
