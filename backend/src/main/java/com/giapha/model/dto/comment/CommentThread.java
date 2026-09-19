package com.giapha.model.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * A comment plus its replies (and grand-replies) so the UI can render a
 * recursive thread from a single payload. The thread is assembled in Java
 * after fetching every comment for a recipe in one query.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentThread {
    private CommentDto comment;
    private List<CommentThread> replies;
}