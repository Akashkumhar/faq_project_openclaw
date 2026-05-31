$body = '{"email":"admin@faq.edu","password":"Admin@12345"}'
try {
    $login = Invoke-RestMethod 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body -ErrorAction Continue
    Write-Host "Login raw:" ($login | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error:" $_.Exception.Message
    try {
        $r = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd()
        Write-Host "Response body:" $r
    } catch {}
}