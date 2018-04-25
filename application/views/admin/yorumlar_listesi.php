<br>
<br>
        <div class="col-xs-12">
          <div class="box">
            <div class="box-header">
			<?php if($this->session->flashdata('mesaj')){?>
				<div class="callout callout-info">
				<h4>İşlem:</h4>
				<p><?=$this->session->flashdata('mesaj')?></p>
              </div>
			  </div>
				<?php } ?>
              <h2 align="center" font-weight=" bold">Yorumlar Tablosu</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  <th bgcolor="#99ccff">Sıra No</th>
                  <th bgcolor="#99ccff">Adı Soyadı</th>
                  <th bgcolor="#99ccff">Email</th>
				  <th bgcolor="#99ccff">Yorum</th>
				  <th bgcolor="#99ccff">Tarih</th>
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				foreach($yorum as $rs)
				{
                ?>
				
				<tr>
                  <td> <?=++$i?></td>
                  <td><?=$rs->adsoy?></td>                  				
				  <td><?=$rs->email?></td>  
				  <td><?=$rs->yorum?></td>
				  <td><?=$rs->tarih?></td>
				 
				 
				
				 <td>
                    <div class="btn-group">
					
           
                    <a href ="<?=base_url() ?>admin/home/yorumsil/<?=$rs->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				<?php } ?>
				
				
				
				
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
