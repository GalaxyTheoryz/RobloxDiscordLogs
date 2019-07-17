local module = {}

local httpservice = game:GetService("HttpService")
local proxyurl = "http://your.domain.here/bot/"

module.get = function(url, headers)
    local request = {}
    request.url = url
    request.method = "get"
    local response = httpservice:PostAsync(proxyurl, request)
    return response
end

module.delete = function(url, headers)
    local request = {}
    request.url = url
    request.method = "delete"
    local response = httpservice:PostAsync(proxyurl, request)
    return response
end

module.post = function(url, request)
    if not request then error("Invalid proxy request") end
    request.url = url
    request.method = "post"
    local response = httpservice:PostAsync(proxyurl, request)
    return response
end

module.put = function(url, request)
    if not request then error("Invalid proxy request") end
    request.url = url
    request.method = "put"
    local response = httpservice:PostAsync(proxyurl, request)
    return response
end

module.patch = function(url, request)
    if not request then error("Invalid proxy request") end
    request.url = url
    request.method = "patch"
    local response = httpservice:PostAsync(proxyurl, request)
    return response
end