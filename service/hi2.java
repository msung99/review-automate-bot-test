package moheng.applicationrunner.dev;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import moheng.applicationrunner.dto.TripRunner;
import moheng.trip.domain.Trip;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Order(2)
@Component
public class TripDevApplicationRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public TripDevApplicationRunner(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String countQuery = "SELECT COUNT(*) FROM trip";
        Long count = jdbcTemplate.queryForObject(countQuery, Long.class);

        if (count == 0) {
            final Resource resource1 = new ClassPathResource("json/trip1.json");
            final Resource resource2 = new ClassPathResource("json/trip2.json");
            final ObjectMapper objectMapper = new ObjectMapper();

            final List<TripRunner> tripRunners = new ArrayList<>();
            tripRunners.addAll(findTripRunnersByResource(resource1, objectMapper));
            tripRunners.addAll(findTripRunnersByResource(resource2, objectMapper));

            // Prepare batch insert
            String sql = "INSERT INTO trip (title, place_name, content_id, description, trip_image_url, map_x, map_y) VALUES (?, ?, ?, ?, ?, ?, ?)";

            List<Object[]> batchArgs = new ArrayList<>();
            for (final TripRunner tripRunner : tripRunners) {
                batchArgs.add(new Object[]{
                        tripRunner.getTitle(),
                        tripRunner.getArea_sigungu_combined(),
                        tripRunner.getContentid(),
                        tripRunner.getOverview(),
                        tripRunner.getFirstimage(),
                        tripRunner.getMapx(),
                        tripRunner.getMapy()
                });
            }

            // Execute batch insert
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
    }

    private List<TripRunner> findTripRunnersByResource(final Resource resource, final ObjectMapper objectMapper) throws IOException {
        return objectMapper.readValue(resource.getInputStream(), new TypeReference<List<TripRunner>>() {});
    }
}
