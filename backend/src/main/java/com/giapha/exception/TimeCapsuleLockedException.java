package com.giapha.exception;

import org.springframework.http.HttpStatus;

/**
 * Time capsule cannot be opened yet. Returns 403 with the days remaining
 * so the client can render an informative countdown message.
 */
public class TimeCapsuleLockedException extends ApiException {

    private final long daysUntilUnlock;

    public TimeCapsuleLockedException(long daysUntilUnlock) {
        super(HttpStatus.FORBIDDEN,
            String.format("Capsule chưa thể mở - còn %d ngày", daysUntilUnlock));
        this.daysUntilUnlock = daysUntilUnlock;
    }

    public long getDaysUntilUnlock() {
        return daysUntilUnlock;
    }
}