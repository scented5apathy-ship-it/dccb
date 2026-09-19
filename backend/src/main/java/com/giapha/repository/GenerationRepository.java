package com.giapha.repository;

import com.giapha.model.entity.Generation;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL access to caygiaphaso.generations.
 */
@Repository
@RequiredArgsConstructor
public class GenerationRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Generation> GEN_MAPPER = (rs, rowNum) -> Generation.builder()
        .id(rs.getObject("id", UUID.class))
        .familyId(rs.getObject("family_id", UUID.class))
        .generationNumber((Integer) rs.getObject("generation_number"))
        .name(rs.getString("name"))
        .startYear((Integer) rs.getObject("start_year"))
        .endYear((Integer) rs.getObject("end_year"))
        .description(rs.getString("description"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    public Generation insert(Generation g) {
        UUID id = g.getId() != null ? g.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.generations " +
            "(id, family_id, generation_number, name, start_year, end_year, description, created_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            id,
            g.getFamilyId(),
            g.getGenerationNumber(),
            g.getName(),
            g.getStartYear(),
            g.getEndYear(),
            g.getDescription()
        );
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load generation after insert: " + id));
    }

    public Optional<Generation> findById(UUID id) {
        try {
            Generation g = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.generations WHERE id = ?", GEN_MAPPER, id);
            return Optional.ofNullable(g);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Generation> findByFamily(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.generations " +
            "WHERE family_id = ? ORDER BY generation_number ASC",
            GEN_MAPPER, familyId);
    }

    public int countMembersInGeneration(UUID generationId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_members WHERE generation_id = ?",
            Integer.class, generationId);
        return c == null ? 0 : c;
    }

    public void deleteById(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.generations WHERE id = ?", id);
    }

    private static OffsetDateTime toOffset(java.sql.Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}
