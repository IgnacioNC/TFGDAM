package com.sara.tfgdam.repository;

import com.sara.tfgdam.domain.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseModuleRepository extends JpaRepository<CourseModule, Long> {
    @Query("select m from CourseModule m left join fetch m.teacher order by m.id")
    List<CourseModule> findAllWithTeacherOrderById();

    @Query("select m from CourseModule m left join fetch m.teacher where m.owner.id = :ownerId order by m.id")
    List<CourseModule> findAllByOwnerIdWithTeacherOrderById(@Param("ownerId") Long ownerId);

    @Query("select m from CourseModule m where m.id = :moduleId and m.owner.id = :ownerId")
    Optional<CourseModule> findByIdAndOwnerId(@Param("moduleId") Long moduleId, @Param("ownerId") Long ownerId);
}
