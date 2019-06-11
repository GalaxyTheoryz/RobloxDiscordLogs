-- Roblox Server Script. Put in ServerScriptService
-- posturl is your hostname
local posturl = ""
local httpservice = game:GetService("HttpService")
local ChatBroadcastRemote = game:GetService("ReplicatedStorage").ChatBroadcast
local queue = {}
local function onPlayerChatted(msg, target, player)
	local data = {
		username = player.Name;
		--content = "`"..player.Name.."`".." Chatted `"..msg.."`"
		content = msg
	}
	if (target) then
		data.username = player.Name.." to "..target.Name
	end
	local encodeddata = httpservice:JSONEncode(data)
	table.insert(encodeddata)
end

local function onPlayerAdded(plr)
	plr.Chatted:Connect(function(msg,target)
		onPlayerChatted(msg,target,plr)
	end)
end

game:GetService("Players").PlayerAdded:Connect(onPlayerAdded)

local count = 0

local function onHeartbeat(delta)
	count = count + delta
	if (count > 5) then
		local encodedArray = httpservice:JSONEncode(queue)
		local messages = httpservice:PostAsync(posturl, encodedArray)
		local messagesDecoded = httpservice:JSONDecode(messages)
		for i,v in pairs(messagesDecoded) do
			ChatBroadcastRemote:FireAllClients(v)
		end
	end
end

game:GetService("RunService").Heartbeat:Connect(onHeartbeat)