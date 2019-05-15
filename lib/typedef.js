/**
 *
 * @typedef {{ warcId: string, text: string}} ExtractedText
 *
 * @typedef {{
 *   warcId: string,
 *   seedId: string,
 *   executionId: string,
 *   jobExecutionId: string,
 *   startTime: Date,
 *   endTime: Date,
 *   timeStamp: Date,
 *   size: number,
 *   wordCount: number,
 *   sentenceCount: number,
 *   longWordCount: number,
 *   lix: number,
 *   characterCount: number,
 *   requestedUri: string,
 *   discoveryPath: string,
 *   contentType: string
 * }} Aggregate

 * @typedef {{
 *   name: string,
 *   field: string,
 *   exclusive: boolean,
 *   value: any
 * }} Filter
 *
 * @typedef {{
 *   id: string,
 *   seedId: string,
 *   validFrom: Date,
 *   validTo: Date,
 *   filters: Filter[]
 * }} FilterSet
 *
 * @typedef {{
 *   entityId: string,
 *   seedId: string,
 *   executionId: string,
 *   jobExecutionId: string,
 *   endTime: Date,
 *   statistic: {...any: {short: number, total: number}},
 * }} Statistic
 */
