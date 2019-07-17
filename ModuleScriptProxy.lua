local module = {}

local httpservice = game:GetService("HttpService")
local proxyurl = "http://your.domain.here/bot/"

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

module.post = function(url, request, headers)
    if not request then error("Invalid proxy request") end
    request.type = "proxy"
    request.url = url
    request.method = "post"
    request.headers = headers
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.put = function(url, request, headers)
    if not request then error("Invalid proxy request") end
    request.type = "proxy"
    request.url = url
    request.method = "put"
    request.headers = headers
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

module.patch = function(url, request, headers)
    if not request then error("Invalid proxy request") end
    request.type = "proxy"
    request.url = url
    request.method = "patch"
    request.headers = headers
    local encodedrequest = httpservice:JSONEncode(request)
    local response = httpservice:PostAsync(proxyurl, encodedrequest)
    return response
end

return module