#!/usr/bin/env bash

# Common retry function for shell scripts
# Usage: retry <max_attempts> <base_delay> <command> [args...]
# Examples:
#   retry 3 5 curl -Lo file.tar.gz https://example.com/file.tar.gz
#   retry 5 2 doctl compute domain get example.com

retry() {
    local max_attempts="$1"
    local base_delay="$2"
    shift 2
    local command=("$@")
    
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts: ${command[*]}"
        
        if "${command[@]}"; then
            echo "✅ Command succeeded on attempt $attempt"
            return 0
        else
            local exit_code=$?
            
            if [ $attempt -eq $max_attempts ]; then
                echo "❌ Command failed after $max_attempts attempts"
                return $exit_code
            fi
            
            # Exponential backoff: base_delay * 2^(attempt-1)
            local delay=$((base_delay * (1 << (attempt - 1))))
            echo "⚠️  Attempt $attempt failed, retrying in ${delay}s..."
            sleep $delay
            attempt=$((attempt + 1))
        fi
    done
}

# Retry function with constant delay (no exponential backoff)
retry_constant() {
    local max_attempts="$1"
    local delay="$2"
    shift 2
    local command=("$@")
    
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts: ${command[*]}"
        
        if "${command[@]}"; then
            echo "✅ Command succeeded on attempt $attempt"
            return 0
        else
            local exit_code=$?
            
            if [ $attempt -eq $max_attempts ]; then
                echo "❌ Command failed after $max_attempts attempts"
                return $exit_code
            fi
            
            echo "⚠️  Attempt $attempt failed, retrying in ${delay}s..."
            sleep $delay
            attempt=$((attempt + 1))
        fi
    done
}