/**
 * Shared helpers for Netlify Functions.
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  }
}

function methodNotAllowed() {
  return jsonResponse(405, { error: 'Method not allowed' })
}

function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: '',
  }
}

module.exports = { corsHeaders, jsonResponse, methodNotAllowed, handleOptions }
