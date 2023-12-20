current_datetime=$(date '+%Y-%m-%d %H:%M:%S')

length=${#CI_COMMIT_MESSAGE}

no_spaces_message="${CI_COMMIT_MESSAGE:0:length-1}"

if [[ "$CI_COMMIT_REF_NAME" == "master" ]] || [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
  export GIT_BRANCH=''
  export CICD_HOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/180e3142-5b21-4442-ae35-f9dc96ee29c5"
else
  export GIT_BRANCH=-$CI_COMMIT_REF_NAME
  export CICD_HOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/f0b1358b-38ce-4f01-b629-64c0d2fbe854"
fi

href="https://${APP}${GIT_BRANCH}.abclive.cloud"

context="{
  \"msg_type\": \"post\",
  \"content\": {
    \"post\": {
      \"zh-CN\": {
        \"title\": \"$CI_PROJECT_NAME $CI_COMMIT_REF_NAME 发布\",
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
  $CICD_HOOK_URL \
  -H 'Content-Type: application/json' \
  -d "$context"
