
export const render_arr: RenderArrInterface[] = [
    {
      label: 'Status',
      key: 'public_badge_url',
      type: 'image'
    },
    {
      label: 'Response Time',
      key: 'latest_event',
      render_value: (val: { latest_event: LatestEvent }) => val.latest_event.metrics.duration
    },
    {
      label: 'Checks',
      key: 'schedule',
      type: 'text'
    },
    {
      label: 'Alerts',
      key: 'realert_interval'
    },
  ]

export const cronitorSampleData: CronitorData = {
  "monitors": [
    {
      "attributes": {
        "group_name": null,
        "site": {
          "ssl": {
            "issued_to": "new.clinicsanmiguel.com",
            "issued_by": "R11",
            "issued_at": "2024-08-03T20:26:54Z",
            "expires_at": "2024-11-01T20:26:53Z"
          },
          "dns": {
            "name": "CLINICSANMIGUEL.COM",
            "expires_at": "2025-11-01T03:52:13Z",
            "registrar": "GoDaddy.com, LLC",
            "name_servers": [
              "NS75.DOMAINCONTROL.COM",
              "NS76.DOMAINCONTROL.COM"
            ]
          }
        },
        "key": "YnJGeQ",
        "code": "YnJGeQ"
      },
      "assertions": [],
      "created": "2024-05-25T15:58:55+00:00",
      "disabled": false,
      "failure_tolerance": null,
      "grace_seconds": 0,
      "consecutive_alert_threshold": 10,
      "group": null,
      "initialized": true,
      "key": "YnJGeQ",
      "latest_event": {
        "stamp": 1723976628.427,
        "msg": "",
        "event": "req-ok",
        "metrics": {
          "duration": 0.408
        },
        "client": null,
        "host": "eu-west-1",
        "ip": ""
      },
      "latest_events": null,
      "latest_issue": null,
      "latest_invocations": null,
      "public_badge_url": "https://cronitor.io/badges/YnJGeQ/production/l6f36-66KxKxAAA2zSrrK-d_TFs.svg",
      "metadata": null,
      "name": "clinca check1",
      "next_expected_at": null,
      "note": null,
      "notify": [
        "default"
      ],
      "passing": true,
      "paused": false,
      "platform": "http",
      "realert_interval": "every 8 hours",
      "request": {
        "url": "https://new.clinicsanmiguel.com/",
        "headers": {},
        "cookies": {},
        "body": "",
        "method": "GET",
        "timeout_seconds": 10,
        "regions": [
          "eu-central-1",
          "us-east-1",
          "eu-west-1",
          "us-west-1"
        ],
        "follow_redirects": true,
        "verify_ssl": true
      },
      "running": false,
      "schedule": "every 5 minutes",
      "schedule_tolerance": null,
      "tags": [],
      "timezone": null,
      "type": "check",
      "environments": [
        "production"
      ],
      "statuspages": [],
      "site": null
    }
  ],
  "page_size": 50,
  "page": 1,
  "total_monitor_count": 1,
  "version": "2020-10-01"
}
