<?php
declare(strict_types=1);
// Admin-only, read-only bridge. No passwords or server credentials in this file.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
function fail(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['code'=>$status,'message'=>$message], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail(405, 'Method not allowed');
$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authorization || strlen($authorization)>8192 || preg_match('/[\r\n]/',$authorization)) fail(401, 'Authentication required');
$token = preg_replace('/^Bearer\s+/i','',$authorization);
$request = curl_init('http://127.0.0.1:5244/api/me');
curl_setopt_array($request,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>8,CURLOPT_HTTPHEADER=>['Authorization: '.$token,'Content-Type: application/json']]);
$body = curl_exec($request);
$status = curl_getinfo($request,CURLINFO_RESPONSE_CODE);
curl_close($request);
$result = is_string($body) ? json_decode($body,true) : null;
if ($status!==200 || !is_array($result) || ($result['code']??0)!==200) fail(401, 'Invalid or expired session');
$roles = $result['data']['role'] ?? [];
if (!is_array($roles)) $roles=[$roles];
if (!in_array(2,array_map('intval',$roles),true)) fail(403, 'Administrator access required');
$file='/var/lib/atp-alist-monitor/dashboard.json';
if (!is_readable($file)) fail(503, 'Dữ liệu theo dõi chưa sẵn sàng.');
$data=json_decode((string)file_get_contents($file),true);
if (!is_array($data) || ($data['schema_version']??0)!==1) fail(503,'Dữ liệu theo dõi chưa sẵn sàng.');
echo json_encode(['code'=>200,'message'=>'success','data'=>$data],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
