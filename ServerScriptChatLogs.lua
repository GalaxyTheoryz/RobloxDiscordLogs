-- posturl is your discord chat webhook link
local posturl = "https://discordapp.com/api/webhooks/586934377339158539/D0nd3bLXy5l8oZ-vJbSWO2ZTQOLIsAC195pOMaiI1DfsZJWk6lRngfwRMfnvDrgW6GJ4"
-- local posturl2 = "https://httpbin.org/post"
local httpservice = game:GetService("HttpService")
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
	print(httpservice:PostAsync(posturl, encodeddata))
end

local function onPlayerAdded(plr)
	plr.Chatted:Connect(function(msg,target)
		onPlayerChatted(msg,target,plr)
	end)
end

game:GetService("Players").PlayerAdded:Connect(onPlayerAdded)