#!/bin/sh
set -eu

BIN=$(dirname "$0")

list_exports() {
    "$BIN/linenos" --all --types --exports "$1" | cut -f1 | sort -u
}

list_decoders() {
    "$BIN/linenos" --all --exports src/index.js | cut -f1 | sort -u
}

tmp1="$(mktemp)"
tmp2="$(mktemp)"
tmp3="$(mktemp)"
tmp4="$(mktemp)"

list_exports src/index.js > "$tmp1"
list_exports src/types/index.d.ts > "$tmp2"
"$BIN/linenos" --json --exports --global-variables --functions src/lib/*.js > "$tmp3"
"$BIN/linenos" --json --exports --global-variables --functions src/types/lib/*.d.ts > "$tmp4"

flow_comment () {
    decoder="$1"
    cat "$tmp3" | jq -r ".[] | select(.name == \"$decoder\" and .comment != null) | .comment"
}

ts_comment () {
    decoder="$1"
    cat "$tmp4" | jq -r ".[] | select(.name == \"$decoder\" and .comment != null) | .comment"
}

echo "==> Checking parity between TypeScript and Flow" >&2
if ! diff -q "$tmp1" "$tmp2" 2>/dev/null >/dev/null; then
    echo "" >&2
    echo "It looks like there is a difference between the exports for" >&2
    echo "TypeScript and for Flow!" >&2
    echo "Please look for differences between the exports in:" >&2
    echo "- src/index.js" >&2
    echo "- src/types/index.d.ts" >&2
    echo "" >&2
    echo "The diff:" >&2
    diff -U3 "$tmp1" "$tmp2" >&2
    echo "" >&2
    exit 2
fi

echo "==> Checking documentation" >&2
list_decoders | while read dec; do
  if grep -qEe "'$dec': {" docs/_data.py; then
      continue
  elif grep -qEe "'aliases':.*'$dec'" docs/_data.py; then
      continue
  else
      echo "❌ $dec" >&2
      echo "" >&2
      echo "It looks like decoder \"$dec\" is not documented yet!" >&2
      echo "To fix this, please add an entry for it in" >&2
      echo "" >&2
      echo "    docs/_data.py" >&2
      echo "" >&2
      exit 3
  fi
done

echo "==> Checking documentation parity between TypeScript and Flow" >&2
list_decoders | while read dec; do
  comment1="$(ts_comment "$dec")"
  comment2="$(flow_comment "$dec")"
  if [ "$comment1" != "$comment2" ]; then
      echo "❌ $dec" >&2
      echo "" >&2
      echo "It looks like the decoder comment for \"$dec\" is different" >&2
      echo "between TypeScript and Flow:" >&2
      echo "" >&2
      echo "<TypeScript comment> ------------------------------------------" >&2
      echo "$comment1" >&2
      echo "</TypeScript comment> -----------------------------------------" >&2
      echo "" >&2
      echo "<Flow comment> ------------------------------------------------" >&2
      echo "$comment2" >&2
      echo "</Flow comment> -----------------------------------------------" >&2
      echo "" >&2
      exit 3
  fi
done

echo "==> Checking type inference tests" >&2
list_decoders | while read dec; do
  if ! grep -qF "$dec" src/types/tests/typescript-inference-test.ts; then
      echo "❌ $dec" >&2
      echo "There is no type inference test for Decoder \"$dec\" in src/types/tests/typescript-inference-test.ts yet." >&2
      exit 4
  fi
done
