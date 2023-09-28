WEB_HOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/f0b1358b-38ce-4f01-b629-64c0d2fbe854"
current_datetime=$(date '+%Y-%m-%d %H:%M:%S')
SELF_DOMAIN_NAME=''

length=${#CI_COMMIT_MESSAGE}

echo $length

no_spaces_message="${CI_COMMIT_MESSAGE:0:length-1}"

if [[ "$CI_COMMIT_REF_NAME" == "master" ]] || [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then SELF_DOMAIN_NAME=''; else SELF_DOMAIN_NAME=-$CI_COMMIT_REF_NAME; fi

href="authserve-${CI_COMMIT_REF_NAME}.abclive.cloud"

echo $href

context="{
  \"msg_type\": \"post\",
  \"content\": {
    \"post\": {
      \"zh-CN\": {
        \"title\": \"CICD信息\",
        \"content\": [
          [
            {
              \"tag\": \"text\",
              \"text\": \"发布仓库：$CI_PROJECT_NAME\n\"
            },
            {
              \"tag\": \"text\",
              \"text\": \"发布分支：$CI_COMMIT_REF_NAME\n\"
            },
            {
              \"tag\": \"text\",
              \"text\": \"发布时间：$current_datetime\n\"
            },
               {
              \"tag\": \"text\",
              \"text\": \"发布信息：$no_spaces_message\n\"
            },
            {
              \"tag\": \"a\",
              \"text\": \"发布地址：$href\",
              \"href\": \"$href\"
            }
          ]
        ]
      }
    }
  }
}"

echo $context
curl -X POST \
  $WEB_HOOK_URL \
  -H 'Content-Type: application/json' \
  -d "$context"
