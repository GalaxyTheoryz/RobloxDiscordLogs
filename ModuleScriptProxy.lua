local module = {}

local httpservice = game:GetService("HttpService")
local proxyurl = require(script.URL)

module.get = function(url, headers)
    local request = {}
    request.type = "proxy"
    request.url = url
    request.method = "get"
    request.headers = headers
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.delete = function(url, headers)
    local request = {}
    request.type = "proxy"
    request.url = url
    request.method = "delete"
    request.headers = headers
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.post = function(url, data, headers)
    if not data then error("Invalid proxy request") end
	local request = {}
    request.type = "proxy"
    request.url = url
    request.method = "post"
    request.headers = headers
	request.body = data
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.put = function(url, data, headers)
    if not data then error("Invalid proxy request") end
	local request = {}
    request.type = "proxy"
    request.url = url
    request.method = "put"
    request.headers = headers
	request.body = data
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.patch = function(url, data, headers)
    if not data then error("Invalid proxy request") end
	local request = {}
    request.type = "proxy"
    request.url = url
    request.method = "patch"
    request.headers = headers
	request.body = data
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

return module