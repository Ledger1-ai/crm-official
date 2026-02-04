Param(
  [string]$Region = "us-west-2",
  [string]$SmaId = "df0b7497-ac52-4f3a-baa1-a5d75a8ebc30",
  [string]$FromPhone = "+17203703285",
  [string]$ToPhone = "+13109946837",
  [string]$ExternalUserId = "azure-agent"
)

Write-Host "[START] SMA JoinChimeMeeting bootstrap"
$token = [guid]::NewGuid().ToString()
$externalMeetingId = "azure-bridge-" + (Get-Date).ToString('yyyyMMddHHmmss')
$meetingOut = aws chime-sdk-meetings create-meeting --region $Region --client-request-token $token --media-region $Region --external-meeting-id $externalMeetingId
$meetingObj = $meetingOut | ConvertFrom-Json
$meetingId = $meetingObj.Meeting.MeetingId
Write-Host "[MEETING_ID] $meetingId"

$attendeeOut = aws chime-sdk-meetings create-attendee --region $Region --meeting-id $meetingId --external-user-id $ExternalUserId
$attendeeObj = $attendeeOut | ConvertFrom-Json
$attendeeId = $attendeeObj.Attendee.AttendeeId
$joinToken = $attendeeObj.Attendee.JoinToken
Write-Host "[ATTENDEE_ID] $attendeeId"

# Persist join info for the web client to consume
$joinInfo = @{ MeetingId = $meetingId; AttendeeId = $attendeeId; JoinToken = $joinToken; Region = $Region }
$joinJson = $joinInfo | ConvertTo-Json -Compress
Set-Content -Path "u:/TUCCRM/basaltcrm-app/aws/chime-sma-lambda/last-join.json" -Value $joinJson -Encoding Ascii
Write-Host "[JOIN_INFO_PATH] u:/TUCCRM/basaltcrm-app/aws/chime-sma-lambda/last-join.json"

# Initiate SMA call with ArgumentsMap containing the meeting join values (multiple key variants)
aws chime-sdk-voice create-sip-media-application-call --region $Region --sip-media-application-id $SmaId --from-phone-number $FromPhone --to-phone-number $ToPhone --arguments-map MeetingId=$meetingId,AttendeeId=$attendeeId,JoinToken=$joinToken,X-Meeting-Id=$meetingId,X-Attendee-Id=$attendeeId,X-Join-Token=$joinToken | Out-Host

Write-Host "[DONE] Request sent - check Lambda logs for JoinChimeMeeting execution"
